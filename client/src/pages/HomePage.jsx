import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CreatePostCard } from '../components/CreatePostCard';
import { PostCard } from '../components/PostCard';
import { StreakWidget } from '../components/StreakWidget';
import { StreakModal } from '../components/StreakModal';
import { api } from '../services/api';
import { 
  Sparkles, 
  RefreshCw, 
  Users, 
  Zap, 
  Bot,
  User,
  ShieldCheck,
  Flame,
  Compass,
  Hash,
  TrendingUp,
  UserPlus,
  UserCheck
} from 'lucide-react';

export const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [feedTab, setFeedTab] = useState('for_you'); // 'for_you' | 'following'
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streakToast, setStreakToast] = useState(null);

  // Dynamic social sidebar data
  const [suggestedCreators, setSuggestedCreators] = useState([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const [trendingHashtags, setTrendingHashtags] = useState([]);

  const fetchPosts = async (tab = feedTab, tag = selectedTag) => {
    setLoadingPosts(true);
    try {
      const params = {};
      if (tab === 'following') {
        params.filter = 'following';
      }
      if (tag) {
        params.tag = tag;
      }
      const res = await api.posts.getFeed(params);
      setPosts(res.posts || []);
    } catch (e) {
      console.error("Error fetching feed:", e);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchSocialWidgets = async () => {
    try {
      setLoadingSuggested(true);
      const [creatorsRes, tagsRes] = await Promise.allSettled([
        api.users.getSuggested(),
        api.posts.getTrendingHashtags(8)
      ]);
      if (creatorsRes.status === 'fulfilled') {
        setSuggestedCreators(creatorsRes.value.creators || []);
      }
      if (tagsRes.status === 'fulfilled') {
        setTrendingHashtags(tagsRes.value.hashtags || []);
      }
    } catch (err) {
      console.error("Error loading social sidebar:", err);
    } finally {
      setLoadingSuggested(false);
    }
  };

  useEffect(() => {
    fetchPosts(feedTab, selectedTag);
  }, [feedTab, selectedTag]);

  useEffect(() => {
    fetchSocialWidgets();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    if (newPost.streak_info && newPost.streak_info.xp_gained) {
      const msg = `🔥 +${newPost.streak_info.xp_gained} XP earned! Current streak: ${newPost.streak_info.current_streak} days.`;
      setStreakToast(msg);
      setTimeout(() => setStreakToast(null), 5000);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => (p.id !== postId && p._id !== postId)));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(p => ((p.id === updatedPost.id || p._id === updatedPost.id || p.id === updatedPost._id) ? updatedPost : p)));
  };

  const handleToggleFollowCreator = async (creatorId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.users.toggleFollow(creatorId);
      setSuggestedCreators(prev => prev.map(c => {
        if (c.id === creatorId || c._id === creatorId) {
          return {
            ...c,
            is_following: res.is_following,
            followers_count: (c.followers_count || 0) + (res.is_following ? 1 : -1)
          };
        }
        return c;
      }));
      // If we are on the following tab, refresh feed to reflect newly followed creators
      if (feedTab === 'following') {
        fetchPosts('following', selectedTag);
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start relative">
      {/* Floating Gamification Toast Notification */}
      {streakToast && (
        <div 
          className="fixed top-16 md:top-6 right-4 md:right-6 z-50 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-semibold backdrop-blur-md"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(239, 68, 68, 0.95))',
            boxShadow: '0 10px 25px rgba(245, 158, 11, 0.4)'
          }}
        >
          <Flame size={18} />
          <span>{streakToast}</span>
        </div>
      )}

      {/* Left Column: Main Feed */}
      <div className="min-w-0 w-full">
        {/* Creator Card */}
        <CreatePostCard
          onPostCreated={handlePostCreated}
          onOpenAuth={() => navigate('/login')}
        />

        {/* Feed Switcher Tabs: For You vs Following */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.5rem'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => { setFeedTab('for_you'); setSelectedTag(''); }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: feedTab === 'for_you' ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                paddingBottom: '0.4rem',
                borderBottom: feedTab === 'for_you' ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Compass size={16} />
              <span>For You</span>
            </button>

            <button
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                setFeedTab('following');
                setSelectedTag('');
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: feedTab === 'following' ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                paddingBottom: '0.4rem',
                borderBottom: feedTab === 'following' ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Users size={16} />
              <span>Following</span>
            </button>
          </div>

          <button
            onClick={() => fetchPosts(feedTab, selectedTag)}
            className="btn btn-secondary"
            title="Refresh Feed"
            style={{ padding: '0.35rem 0.65rem' }}
          >
            <RefreshCw size={14} className={loadingPosts ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tag Filters */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '1.25rem',
          overflowX: 'auto',
          paddingBottom: '0.2rem'
        }}>
          <button
            onClick={() => setSelectedTag('')}
            className={`btn ${selectedTag === '' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)' }}
          >
            All Topics
          </button>
          {(trendingHashtags.length > 0 ? trendingHashtags.slice(0, 5).map(h => h.tag) : ['ai', 'innovation', 'creativity', 'buildinpublic', 'tech']).map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
              className={`btn ${selectedTag === tag ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)' }}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Posts Stream */}
        {loadingPosts ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-panel" style={{ padding: '1.5rem', minHeight: '160px' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border-subtle)', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: '120px', height: '14px', background: 'var(--border-subtle)', borderRadius: '4px', marginBottom: '6px' }} />
                    <div style={{ width: '80px', height: '10px', background: 'var(--border-subtle)', borderRadius: '4px' }} />
                  </div>
                </div>
                <div style={{ width: '100%', height: '16px', background: 'var(--border-subtle)', borderRadius: '4px', marginBottom: '8px' }} />
                <div style={{ width: '70%', height: '16px', background: 'var(--border-subtle)', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <Sparkles size={36} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              {feedTab === 'following' ? "No posts from followed creators yet" : "No posts found"}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto 1.25rem' }}>
              {feedTab === 'following'
                ? "Follow inspiring creators from the right sidebar or explore trending posts on the Explore page!"
                : selectedTag
                  ? `No community posts tagged #${selectedTag} yet.`
                  : 'Be the first to share an inspiring thought with the Aura community!'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {feedTab === 'following' && (
                <button
                  onClick={() => setFeedTab('for_you')}
                  className="btn btn-primary"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                >
                  Switch to For You Feed
                </button>
              )}
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag('')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                >
                  Clear #{selectedTag} Filter
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {posts.map(post => (
              <PostCard
                key={post.id || post._id}
                post={post}
                onPostDeleted={handlePostDeleted}
                onPostUpdated={handlePostUpdated}
                onOpenAuth={() => navigate('/login')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Dynamic Social Widgets */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-6 w-full">
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

        {/* Daily Streak & Gamification Widget */}
        <StreakWidget 
          onOpenModal={() => setShowStreakModal(true)} 
        />

        {/* Dynamic Trending Hashtags Widget */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={17} color="var(--primary)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Trending Hashtags</h3>
            </div>
            <button
              onClick={() => navigate('/explore')}
              style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--accent-cyan)', cursor: 'pointer' }}
            >
              Explore
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {trendingHashtags.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Discovering trending hashtags...
              </div>
            ) : (
              trendingHashtags.slice(0, 6).map((item, idx) => (
                <div
                  key={item.tag}
                  onClick={() => setSelectedTag(item.tag)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    background: selectedTag === item.tag ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: selectedTag === item.tag ? '1px solid var(--primary)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Hash size={13} color="var(--primary)" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.tag}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {item.count} {item.count === 1 ? 'post' : 'posts'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Suggested Creators Widget */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={17} color="var(--primary)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Suggested Creators</h3>
            </div>
            <button
              onClick={fetchSocialWidgets}
              title="Refresh suggestions"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <RefreshCw size={13} className={loadingSuggested ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loadingSuggested && suggestedCreators.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                Finding active creators...
              </div>
            ) : suggestedCreators.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                You're all caught up with the community!
              </div>
            ) : (
              suggestedCreators.slice(0, 5).map(creator => {
                const cid = creator.id || creator._id;
                return (
                  <div key={cid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div 
                      onClick={() => navigate(`/profile/${creator.username}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flex: 1, minWidth: 0, marginRight: '0.5rem' }}
                    >
                      <img
                        src={creator.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${creator.username}`}
                        alt={creator.username}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e293b', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {creator.display_name || creator.username}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          @{creator.username} • {creator.followers_count || 0} followers
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleToggleFollowCreator(cid)}
                      className={`btn ${creator.is_following ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ fontSize: '0.72rem', padding: '0.22rem 0.65rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      {creator.is_following ? (
                        <>
                          <UserCheck size={11} />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={11} />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* AI Features Spotlight */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Zap size={18} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>AI Social Suite</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>✓</span>
              <span><strong>AI Post Generation</strong>: Craft rich hooks & hashtags</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#6366f1' }}>✓</span>
              <span><strong>Smart Discussion Recaps</strong>: One-click thread summaries</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#06b6d4' }}>✓</span>
              <span><strong>AI Trend Radar</strong>: Gemini-powered viral topics</span>
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
      </div>

      {/* Visual Streak & Calendar Modal */}
      <StreakModal 
        isOpen={showStreakModal} 
        onClose={() => setShowStreakModal(false)} 
      />
    </div>
  );
};
export default HomePage;
