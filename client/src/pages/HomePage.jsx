import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CreatePostCard } from '../components/CreatePostCard';
import { PostCard } from '../components/PostCard';
import { api } from '../services/api';
import { 
  Sparkles, 
  RefreshCw, 
  Users, 
  Zap, 
  Bot,
  User,
  ShieldCheck
} from 'lucide-react';

export const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');

  const fetchPosts = async (tag = '') => {
    setLoadingPosts(true);
    try {
      const res = await api.posts.getFeed(tag ? { tag } : {});
      setPosts(res.posts || []);
    } catch (e) {
      console.error("Error fetching feed:", e);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts(selectedTag);
  }, [selectedTag]);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => (p.id !== postId && p._id !== postId)));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(p => ((p.id === updatedPost.id || p._id === updatedPost.id || p.id === updatedPost._id) ? updatedPost : p)));
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 320px',
      gap: '1.5rem',
      alignItems: 'start'
    }}>
      {/* Left Column: Feed */}
      <div>
        {/* Creator Card */}
        <CreatePostCard
          onPostCreated={handlePostCreated}
          onOpenAuth={() => navigate('/login')}
        />

        {/* Tag filters & refresh bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            <button
              onClick={() => setSelectedTag('')}
              className={`btn ${selectedTag === '' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              🔥 All Posts
            </button>
            {['ai', 'innovation', 'technology', 'creativity'].map(t => (
              <button
                key={t}
                onClick={() => setSelectedTag(selectedTag === t ? '' : t)}
                className={`btn ${selectedTag === t ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                #{t}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchPosts(selectedTag)}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            title="Refresh Feed"
          >
            <RefreshCw size={13} className={loadingPosts ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Feed Posts */}
        {loadingPosts ? (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
            <div>Loading posts...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <Sparkles size={32} color="var(--accent-cyan)" style={{ marginBottom: '0.75rem' }} />
            <h3>No posts yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
              Be the first to share an update or use AI to draft a post!
            </p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id || post._id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onPostUpdated={handlePostUpdated}
              onOpenAuth={() => navigate('/login')}
            />
          ))
        )}
      </div>

      {/* Right Column: AI Insights & Platform Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* User Card */}
        {user && (
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.username}
                style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1e293b' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user.username}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
              <button
                onClick={() => navigate(`/profile/${user.username}`)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              >
                Profile
              </button>
            </div>
            {user.bio && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {user.bio}
              </p>
            )}
          </div>
        )}

        {/* AI Features Spotlight */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Zap size={18} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1rem' }}>AI Social Suite</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>✓</span>
              <span><strong>AI Post Generation</strong>: Craft rich hooks & hashtags by topic</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#6366f1' }}>✓</span>
              <span><strong>Tone Polishers</strong>: Professional, witty, and inspirational</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#06b6d4' }}>✓</span>
              <span><strong>Discussion Summaries</strong>: 1-click thread recap & sentiments</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#f59e0b' }}>✓</span>
              <span><strong>Smart Replies</strong>: Instant contextual comment suggestions</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#f43f5e' }}>✓</span>
              <span><strong>Safety Guard</strong>: Automated toxicity & spam moderation</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/assistant')}
            className="btn btn-ai"
            style={{ width: '100%', marginTop: '1rem', fontSize: '0.82rem' }}
          >
            <Bot size={15} />
            <span>Open Aura AI Chat</span>
          </button>
        </div>

        {/* Suggested Creators */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={17} color="var(--primary)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Suggested for you</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>See All</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { name: 'Sarah Chen', handle: 'sarah_ai', role: 'AI Researcher', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
              { name: 'Marcus Vance', handle: 'marcus_v', role: 'Product Designer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
              { name: 'Elena Rostova', handle: 'elena_tech', role: 'Prompt Engineer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' }
            ].map(creator => (
              <div key={creator.handle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>{creator.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>@{creator.handle}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)' }}
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    btn.innerText = btn.innerText === 'Follow' ? 'Following' : 'Follow';
                    btn.classList.toggle('btn-primary');
                    btn.classList.toggle('btn-secondary');
                  }}
                >
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
