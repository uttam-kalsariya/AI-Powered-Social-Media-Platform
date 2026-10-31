import React, { useState, useEffect } from 'react';
import { Search, Hash, TrendingUp, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { PostCard } from '../components/PostCard';

export const ExplorePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const tags = ['ai', 'technology', 'design', 'future', 'innovation', 'creativity', 'startups'];

  const fetchExplorePosts = async (tag = '') => {
    setLoading(true);
    try {
      const res = await api.posts.getFeed(tag ? { tag } : {});
      setPosts(res.posts || []);
    } catch (e) {
      console.error("Explore fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExplorePosts(selectedTag);
  }, [selectedTag]);

  const filteredPosts = posts.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.content && p.content.toLowerCase().includes(term)) ||
      (p.author_username && p.author_username.toLowerCase().includes(term)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
    );
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Search Header */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search topics, creators, hashtags or discussions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.6rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.92rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Trending Tags Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <TrendingUp size={13} color="var(--primary)" /> Trending:
          </span>
          <button
            onClick={() => setSelectedTag('')}
            className={`btn ${selectedTag === '' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
          >
            All Channels
          </button>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
              className={`btn ${selectedTag === tag ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Explore Results */}
      <div>
        {loading ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
            <div>Exploring trending content...</div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <Sparkles size={32} color="var(--accent-cyan)" style={{ marginBottom: '0.75rem' }} />
            <h3>No results found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
              Try searching for other keywords or explore popular hashtags above.
            </p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <PostCard
              key={post.id || post._id}
              post={post}
              onPostDeleted={(id) => setPosts(prev => prev.filter(p => (p.id !== id && p._id !== id)))}
              onPostUpdated={(up) => setPosts(prev => prev.map(p => (p.id === up.id || p._id === up.id ? up : p)))}
              onOpenAuth={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
};
export default ExplorePage;
