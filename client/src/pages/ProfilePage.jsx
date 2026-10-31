import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PostCard } from '../components/PostCard';
import { User, Mail, Shield, Calendar, Edit3, Grid, Sparkles, RefreshCw } from 'lucide-react';

export const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const isMe = !username || username === currentUser?.username;
  const targetUsername = isMe ? currentUser?.username : username;

  const [profile, setProfile] = useState(isMe ? currentUser : null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        if (!isMe && targetUsername) {
          const res = await api.users.getProfile(targetUsername);
          setProfile(res.user);
        } else {
          setProfile(currentUser);
        }

        // Fetch user posts
        const postsRes = await api.posts.getFeed();
        const allPosts = postsRes.posts || [];
        const filtered = allPosts.filter(p => p.author_username === targetUsername);
        setUserPosts(filtered);
      } catch (e) {
        console.error("Profile load error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [targetUsername, currentUser, isMe]);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
        <div>Loading profile...</div>
      </div>
    );
  }

  const displayUser = profile || currentUser;

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Profile Card Header */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <img
            src={displayUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${displayUser?.username || 'user'}`}
            alt={displayUser?.username}
            style={{ width: '96px', height: '96px', borderRadius: '50%', background: '#1e293b', border: '3px solid var(--primary)' }}
          />

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>@{displayUser?.username}</h2>
              {displayUser?.role === 'admin' ? (
                <span className="badge badge-admin">Administrator</span>
              ) : (
                <span className="badge badge-primary">Member</span>
              )}
              {isMe && (
                <button
                  onClick={() => navigate('/settings')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Edit3 size={14} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', margin: '0.85rem 0', fontSize: '0.9rem' }}>
              <div><strong>{userPosts.length}</strong> <span style={{ color: 'var(--text-secondary)' }}>Posts</span></div>
              <div><strong>0</strong> <span style={{ color: 'var(--text-secondary)' }}>Followers</span></div>
              <div><strong>0</strong> <span style={{ color: 'var(--text-secondary)' }}>Following</span></div>
            </div>

            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.45 }}>
              {displayUser?.bio || 'Excited to connect on AI Social!'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Mail size={13} /> {displayUser?.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={13} /> Joined {displayUser?.created_at ? new Date(displayUser.created_at).toLocaleDateString() : 'Recently'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab: Posts Grid / List */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Grid size={15} />
          <span>Posts ({userPosts.length})</span>
        </button>
      </div>

      {userPosts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Sparkles size={32} color="var(--accent-cyan)" style={{ marginBottom: '0.75rem' }} />
          <h3>No posts published yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            {isMe ? 'Share an update or draft an AI post on the home feed!' : `@${displayUser?.username} has not posted yet.`}
          </p>
        </div>
      ) : (
        userPosts.map(post => (
          <PostCard
            key={post.id || post._id}
            post={post}
            onPostDeleted={(id) => setUserPosts(prev => prev.filter(p => (p.id !== id && p._id !== id)))}
            onPostUpdated={(up) => setUserPosts(prev => prev.map(p => (p.id === up.id || p._id === up.id ? up : p)))}
            onOpenAuth={() => {}}
          />
        ))
      )}
    </div>
  );
};
export default ProfilePage;
