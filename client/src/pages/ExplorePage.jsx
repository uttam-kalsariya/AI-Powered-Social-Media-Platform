import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Hash, 
  TrendingUp, 
  Sparkles, 
  Filter, 
  RefreshCw, 
  Grid, 
  List, 
  Zap, 
  Users, 
  UserPlus, 
  UserCheck, 
  Compass,
  Flame,
  ArrowUpRight,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { PostCard } from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const ExplorePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [activeModalPost, setActiveModalPost] = useState(null);
  
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // AI Trending Topics & dynamic hashtags
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [suggestedCreators, setSuggestedCreators] = useState([]);
  const [loadingAiTrends, setLoadingAiTrends] = useState(true);

  // Fetch explore feed with search/tag query
  const fetchExploreFeed = async (q = searchTerm, tag = selectedTag) => {
    setLoadingPosts(true);
    try {
      const res = await api.posts.getExplore({
        q: q.trim(),
        tag: tag.trim(),
        limit: 40
      });
      setPosts(res.posts || []);
    } catch (e) {
      console.error("Explore fetch error:", e);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Fetch AI trends, hashtags, suggested creators
  const fetchExploreIntelligence = async () => {
    setLoadingAiTrends(true);
    try {
      const [aiRes, tagsRes, creatorsRes] = await Promise.allSettled([
        api.ai.getTrendingTopics(),
        api.posts.getTrendingHashtags(12),
        api.users.getSuggested()
      ]);

      if (aiRes.status === 'fulfilled') {
        setTrendingTopics(aiRes.value.topics || []);
      }
      if (tagsRes.status === 'fulfilled') {
        setTrendingHashtags(tagsRes.value.hashtags || []);
      }
      if (creatorsRes.status === 'fulfilled') {
        setSuggestedCreators(creatorsRes.value.creators || []);
      }
    } catch (err) {
      console.error("Error loading explore intelligence:", err);
    } finally {
      setLoadingAiTrends(false);
    }
  };

  useEffect(() => {
    fetchExploreIntelligence();
  }, []);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExploreFeed(searchTerm, selectedTag);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedTag]);

  const handleToggleFollow = async (creatorId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.users.toggleFollow(creatorId);
      setSuggestedCreators(prev => prev.map(c => {
        if (c.id === creatorId || c._id === creatorId) {
          return { ...c, is_following: res.is_following };
        }
        return c;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Search & Header Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search trending topics, hashtags, creators or discussions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.6rem',
                fontSize: '0.92rem'
              }}
            />
          </div>

          {/* View mode toggle */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-surface-elevated)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setViewMode('list')}
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem', borderRadius: '6px' }}
              title="Stream List View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem', borderRadius: '6px' }}
              title="Media Grid View"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>

        {/* Dynamic Hashtag Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <TrendingUp size={14} color="var(--primary)" /> Top Tags:
          </span>
          <button
            onClick={() => setSelectedTag('')}
            className={`btn ${selectedTag === '' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-full)' }}
          >
            All Discussions
          </button>
          {(trendingHashtags.length > 0
            ? trendingHashtags
            : [{ tag: 'ai', count: 12 }, { tag: 'innovation', count: 8 }, { tag: 'creativity', count: 6 }, { tag: 'buildinpublic', count: 5 }]
          ).map(item => (
            <button
              key={item.tag}
              onClick={() => setSelectedTag(selectedTag === item.tag ? '' : item.tag)}
              className={`btn ${selectedTag === item.tag ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-full)' }}
            >
              #{item.tag}
              {item.count ? <span style={{ opacity: 0.6, marginLeft: '0.3rem' }}>{item.count}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {/* AI Trending Topics Radar Banner */}
      {trendingTopics.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} color="var(--accent-amber)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>AI Trend Radar</h3>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>Gemini Powered</span>
            </div>
            <button
              onClick={fetchExploreIntelligence}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
            >
              <RefreshCw size={12} className={loadingAiTrends ? 'animate-spin' : ''} />
              <span>Refresh Trends</span>
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '0.85rem'
          }}>
            {trendingTopics.map((topic, i) => (
              <div
                key={i}
                onClick={() => {
                  if (topic.keywords && topic.keywords[0]) {
                    setSelectedTag(topic.keywords[0].replace('#', ''));
                  }
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    {topic.category || 'Trending'}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {topic.volume || 'Viral'}
                  </span>
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                  {topic.topic}
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  {topic.summary}
                </p>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {(topic.keywords || []).map(kw => (
                    <span key={kw} style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {kw.startsWith('#') ? kw : `#${kw}`}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Creators Discovery Bar */}
      {suggestedCreators.length > 0 && !searchTerm && (
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Users size={17} color="var(--primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Discover Community Creators</h3>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.85rem'
          }}>
            {suggestedCreators.slice(0, 4).map(c => {
              const cid = c.id || c._id;
              return (
                <div
                  key={cid}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '0.85rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <img
                    src={c.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.username}`}
                    alt={c.username}
                    onClick={() => navigate(`/profile/${c.username}`)}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1e293b', marginBottom: '0.5rem', cursor: 'pointer' }}
                  />
                  <div
                    onClick={() => navigate(`/profile/${c.username}`)}
                    style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    {c.display_name || c.username}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                    @{c.username} • {c.followers_count || 0} followers
                  </div>
                  <button
                    onClick={() => handleToggleFollow(cid)}
                    className={`btn ${c.is_following ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.8rem', borderRadius: 'var(--radius-full)', width: '100%' }}
                  >
                    {c.is_following ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explore Feed Results */}
      <div>
        {loadingPosts ? (
          <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
            <div>Exploring trending content...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center' }}>
            <Sparkles size={36} color="var(--accent-cyan)" style={{ marginBottom: '0.75rem' }} />
            <h3>No discussions found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem', maxWidth: '380px', margin: '0.3rem auto 1rem' }}>
              Try searching with different keywords, or click on one of the top trending hashtags above.
            </p>
            {(searchTerm || selectedTag) && (
              <button
                onClick={() => { setSearchTerm(''); setSelectedTag(''); }}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          /* List Stream View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {posts.map(post => (
              <PostCard
                key={post.id || post._id}
                post={post}
                onPostDeleted={(id) => setPosts(prev => prev.filter(p => (p.id !== id && p._id !== id)))}
                onPostUpdated={(up) => setPosts(prev => prev.map(p => (p.id === up.id || p._id === up.id ? up : p)))}
                onOpenAuth={() => navigate('/login')}
              />
            ))}
          </div>
        ) : (
          /* Visual Media Grid View */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {posts.map(post => (
              <div
                key={post.id || post._id}
                onClick={() => setActiveModalPost(post)}
                className="glass-panel group"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <img
                      src={post.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.author_name}`}
                      alt={post.author_name}
                      style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--bg-surface-elevated)' }}
                    />
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{post.author_name}</div>
                  </div>

                  {post.image_url && (
                    <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '0.75rem', maxHeight: '180px' }}>
                      <img src={post.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}

                  <p style={{
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    color: 'var(--text-primary)',
                    display: '-webkit-box',
                    WebkitLineClamp: post.image_url ? 3 : 5,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {post.content}
                  </p>
                </div>

                <div style={{ marginTop: '0.85rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  <span>❤️ {post.likes_count || 0}</span>
                  <span>💬 {post.comments_count || 0}</span>
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    {(post.tags || []).slice(0, 2).map(t => (
                      <span key={t} style={{ color: 'var(--primary)' }}>#{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Detail Modal from Grid View Click */}
      {activeModalPost && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <button
                onClick={() => setActiveModalPost(null)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem', borderRadius: '50%' }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
            <PostCard
              post={activeModalPost}
              onPostDeleted={(id) => {
                setPosts(prev => prev.filter(p => (p.id !== id && p._id !== id)));
                setActiveModalPost(null);
              }}
              onPostUpdated={(up) => {
                setPosts(prev => prev.map(p => (p.id === up.id || p._id === up.id ? up : p)));
                setActiveModalPost(up);
              }}
              onOpenAuth={() => navigate('/login')}
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default ExplorePage;
