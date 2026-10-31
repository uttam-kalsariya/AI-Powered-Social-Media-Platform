import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { CreatePostCard } from './components/CreatePostCard';
import { PostCard } from './components/PostCard';
import { AdminDashboard } from './components/AdminDashboard';
import { AiAssistantView } from './components/AiAssistantView';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { api } from './services/api';
import { 
  Sparkles, 
  TrendingUp, 
  Filter, 
  RefreshCw, 
  Users, 
  ShieldCheck, 
  Bot,
  Zap,
  Globe
} from 'lucide-react';

const MainLayout = () => {
  const { user, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState('feed'); // 'feed' | 'assistant' | 'admin'
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Feed posts state
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '1.5rem', flex: 1 }}>
        {/* TAB: ADMIN DASHBOARD */}
        {currentTab === 'admin' && (
          isAdmin ? (
            <AdminDashboard />
          ) : (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
              <ShieldCheck size={36} color="var(--accent-rose)" style={{ marginBottom: '0.75rem' }} />
              <h3>Admin Access Required</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Please log in with an administrator account to access platform metrics and moderation.
              </p>
              <button onClick={() => setAuthModalOpen(true)} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Sign in as Admin
              </button>
            </div>
          )
        )}

        {/* TAB: AI ASSISTANT VIEW */}
        {currentTab === 'assistant' && (
          <AiAssistantView />
        )}

        {/* TAB: FEED VIEW */}
        {currentTab === 'feed' && (
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
                onOpenAuth={() => setAuthModalOpen(true)}
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
                    onOpenAuth={() => setAuthModalOpen(true)}
                  />
                ))
              )}
            </div>

            {/* Right Column: AI Insights & Platform Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                  onClick={() => setCurrentTab('assistant')}
                  className="btn btn-ai"
                  style={{ width: '100%', marginTop: '1rem', fontSize: '0.82rem' }}
                >
                  <Bot size={15} />
                  <span>Open Aura AI Chat</span>
                </button>
              </div>

              {/* Quick Persona Switcher Helper */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Users size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: '1rem' }}>Test Personas</h3>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                  Easily evaluate both Admin and User roles with 1-click demo accounts:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(217, 70, 239, 0.08)',
                    border: '1px solid rgba(217, 70, 239, 0.25)',
                    fontSize: '0.78rem'
                  }}>
                    <div style={{ fontWeight: 600, color: '#f0abfc' }}>🛡️ Admin Account</div>
                    <div style={{ color: 'var(--text-muted)' }}>admin@aisocial.local / AdminPass123!</div>
                  </div>
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    fontSize: '0.78rem'
                  }}>
                    <div style={{ fontWeight: 600, color: '#a5b4fc' }}>👤 Demo User Account</div>
                    <div style={{ color: 'var(--text-muted)' }}>alex@aisocial.local / UserPass123!</div>
                  </div>
                </div>

                {!user && (
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '0.85rem', fontSize: '0.82rem' }}
                  >
                    Quick Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
