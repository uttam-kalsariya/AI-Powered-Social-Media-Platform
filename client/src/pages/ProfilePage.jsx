import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PostCard } from '../components/PostCard';
import { StreakModal } from '../components/StreakModal';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Edit3, 
  Grid, 
  Sparkles, 
  RefreshCw,
  Flame,
  Award,
  Zap,
  Trophy,
  ArrowRight,
  Bookmark,
  Users,
  UserPlus,
  UserCheck,
  X,
  Folder
} from 'lucide-react';

export const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const isMe = !username || username === currentUser?.username;
  const targetUsername = isMe ? currentUser?.username : username;

  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedCollections, setSavedCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'saved'
  
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [modalTab, setModalTab] = useState('calendar');

  // Follow/Unfollow interaction state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Social graph modal state (Followers / Following list)
  const [socialModalType, setSocialModalType] = useState(null); // 'followers' | 'following' | null
  const [socialList, setSocialList] = useState([]);
  const [loadingSocialList, setLoadingSocialList] = useState(false);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      if (targetUsername) {
        const res = await api.users.getProfile(targetUsername);
        const userData = res.user;
        setProfile(userData);
        setIsFollowing(userData.is_following || false);
        setFollowersCount(userData.followers_count || 0);
        setFollowingCount(userData.following_count || 0);

        // Fetch user posts
        const postsRes = await api.posts.getFeed({ author_id: userData.id || userData._id });
        setUserPosts(postsRes.posts || []);

        // Fetch streak gamification info
        try {
          const streakRes = await api.streaks.getUserStreak(targetUsername);
          setStreakData(streakRes.streak || null);
        } catch (err) {
          console.error("Streak load error:", err);
        }
      }
    } catch (e) {
      console.error("Profile load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPosts = async (col = selectedCollection) => {
    if (!isMe) return;
    setLoadingSaved(true);
    try {
      const [postsRes, collRes] = await Promise.allSettled([
        api.posts.getSavedPosts(col),
        api.posts.getSavedCollections()
      ]);
      if (postsRes.status === 'fulfilled') {
        setSavedPosts(postsRes.value.posts || []);
      }
      if (collRes.status === 'fulfilled') {
        setSavedCollections(collRes.value.collections || []);
      }
    } catch (err) {
      console.error("Error loading saved posts:", err);
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [targetUsername]);

  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedPosts(selectedCollection);
    }
  }, [activeTab, selectedCollection]);

  const handleToggleFollow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const targetId = profile?.id || profile?._id;
    if (!targetId || followLoading) return;

    setFollowLoading(true);
    try {
      const res = await api.users.toggleFollow(targetId);
      setIsFollowing(res.is_following);
      setFollowersCount(prev => prev + (res.is_following ? 1 : -1));
    } catch (err) {
      console.error("Toggle follow error:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleOpenSocialModal = async (type) => {
    const targetId = profile?.id || profile?._id;
    if (!targetId) return;

    setSocialModalType(type);
    setLoadingSocialList(true);
    try {
      if (type === 'followers') {
        const res = await api.users.getFollowers(targetId);
        setSocialList(res.followers || []);
      } else {
        const res = await api.users.getFollowing(targetId);
        setSocialList(res.following || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSocialList(false);
    }
  };

  const handleToggleListFollow = async (userId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.users.toggleFollow(userId);
      setSocialList(prev => prev.map(u => {
        if (u.id === userId || u._id === userId) {
          return { ...u, is_following: res.is_following };
        }
        return u;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
        <div>Loading profile...</div>
      </div>
    );
  }

  const displayUser = profile || currentUser;

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Profile Card Header */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <img
            src={displayUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${displayUser?.username || 'user'}`}
            alt={displayUser?.username}
            style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', border: '3px solid var(--primary)', objectFit: 'cover' }}
          />

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                {displayUser?.display_name || `@${displayUser?.username}`}
              </h2>
              {displayUser?.role === 'admin' ? (
                <span className="badge badge-admin">Administrator</span>
              ) : (
                <span className="badge badge-primary">Member</span>
              )}

              {/* Edit Profile or Follow/Unfollow Button */}
              {isMe ? (
                <button
                  onClick={() => navigate('/settings')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Edit3 size={14} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ fontSize: '0.82rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: 'var(--radius-full)' }}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={14} />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {displayUser?.display_name && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                @{displayUser?.username}
              </div>
            )}

            {/* Social Metric Pills */}
            <div style={{ display: 'flex', gap: '1.25rem', margin: '0.85rem 0', fontSize: '0.9rem', flexWrap: 'wrap' }}>
              <div>
                <strong>{userPosts.length}</strong> <span style={{ color: 'var(--text-secondary)' }}>Posts</span>
              </div>
              <div 
                onClick={() => handleOpenSocialModal('followers')} 
                style={{ cursor: 'pointer', borderBottom: '1px dashed var(--border-subtle)' }}
                title="View followers"
              >
                <strong>{followersCount}</strong> <span style={{ color: 'var(--text-secondary)' }}>Followers</span>
              </div>
              <div 
                onClick={() => handleOpenSocialModal('following')} 
                style={{ cursor: 'pointer', borderBottom: '1px dashed var(--border-subtle)' }}
                title="View following"
              >
                <strong>{followingCount}</strong> <span style={{ color: 'var(--text-secondary)' }}>Following</span>
              </div>
              <div>
                <strong>{streakData ? streakData.current_streak : 0}d</strong> <span style={{ color: 'var(--text-secondary)' }}>Streak</span>
              </div>
              <div>
                <strong>{streakData ? streakData.xp : 0}</strong> <span style={{ color: 'var(--text-secondary)' }}>XP</span>
              </div>
            </div>

            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.45 }}>
              {displayUser?.bio || 'Excited to connect on AI Social!'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
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

      {/* Gamification & Streaks Card */}
      {streakData && (
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Flame size={20} color="#f59e0b" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Activity Streaks & Badges
              </h3>
            </div>
            <button
              onClick={() => {
                setModalTab('calendar');
                setShowStreakModal(true);
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>View Streak Calendar</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '0.75rem'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Current Streak</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Flame size={18} />
                <span>{streakData.current_streak} Days</span>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '0.75rem'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Longest Streak</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ec4899', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Zap size={18} />
                <span>{streakData.longest_streak || 0} Days</span>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '0.75rem'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Creator Tier</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#6366f1', marginTop: '0.2rem' }}>
                Lvl {streakData.level} • {streakData.level_title}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '0.75rem'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Community Trophies</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Trophy size={18} />
                <span>{streakData.unlocked_badges ? streakData.unlocked_badges.length : 0} Unlocked</span>
              </div>
            </div>
          </div>

          {/* Unlocked Badges Preview */}
          {streakData.unlocked_badges && streakData.unlocked_badges.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Badges:</span>
              {streakData.unlocked_badges.map(b => (
                <div
                  key={b.id}
                  onClick={() => {
                    setModalTab('badges');
                    setShowStreakModal(true);
                  }}
                  title={`${b.name}: ${b.description}`}
                  style={{
                    padding: '0.25rem 0.55rem',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontSize: '0.75rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>{b.icon}</span>
                  <span style={{ fontWeight: 600 }}>{b.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs Bar: Posts vs Saved Posts */}
      <div style={{
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setActiveTab('posts')}
          className={`btn ${activeTab === 'posts' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Grid size={15} />
          <span>Posts ({userPosts.length})</span>
        </button>

        {isMe && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`btn ${activeTab === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Bookmark size={15} />
            <span>Saved Bookmarks</span>
          </button>
        )}
      </div>

      {/* Tab Content: Posts */}
      {activeTab === 'posts' && (
        <div>
          {userPosts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <Sparkles size={32} color="var(--accent-cyan)" style={{ marginBottom: '0.75rem' }} />
              <h3>No posts published yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                {isMe ? 'Share an update or draft an AI post on the home feed!' : `@${displayUser?.username} has not posted yet.`}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {userPosts.map(post => (
                <PostCard
                  key={post.id || post._id}
                  post={post}
                  onPostDeleted={(id) => setUserPosts(prev => prev.filter(p => (p.id !== id && p._id !== id)))}
                  onPostUpdated={(up) => setUserPosts(prev => prev.map(p => (p.id === up.id || p._id === up.id ? up : p)))}
                  onOpenAuth={() => navigate('/login')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Saved Posts & Collections */}
      {activeTab === 'saved' && isMe && (
        <div>
          {/* Collections Filter Bar */}
          {savedCollections.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
              <button
                onClick={() => setSelectedCollection('')}
                className={`btn ${selectedCollection === '' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)' }}
              >
                All Folders
              </button>
              {savedCollections.map(c => (
                <button
                  key={c.name}
                  onClick={() => setSelectedCollection(selectedCollection === c.name ? '' : c.name)}
                  className={`btn ${selectedCollection === c.name ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Folder size={12} />
                  <span>{c.name}</span>
                  <span style={{ opacity: 0.6 }}>({c.count})</span>
                </button>
              ))}
            </div>
          )}

          {loadingSaved ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
              <div>Loading your saved bookmarks...</div>
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <Bookmark size={36} color="var(--accent-amber)" style={{ margin: '0 auto 0.75rem' }} />
              <h3>No saved posts in this collection</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                Click the Bookmark icon on any post across the platform to save it to your private library.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {savedPosts.map(post => (
                <PostCard
                  key={post.id || post._id}
                  post={post}
                  onPostDeleted={(id) => setSavedPosts(prev => prev.filter(p => (p.id !== id && p._id !== id)))}
                  onPostUpdated={(up) => setSavedPosts(prev => prev.map(p => (p.id === up.id || p._id === up.id ? up : p)))}
                  onOpenAuth={() => navigate('/login')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Social Graph Modal (Followers / Following) */}
      {socialModalType && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, textTransform: 'capitalize' }}>
                {socialModalType} ({socialList.length})
              </h3>
              <button
                onClick={() => setSocialModalType(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {loadingSocialList ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                  <div>Loading users...</div>
                </div>
              ) : socialList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No {socialModalType} to display yet.
                </div>
              ) : (
                socialList.map(item => {
                  const uid = item.id || item._id;
                  const isCurrent = currentUser && (currentUser.id === uid || currentUser._id === uid);
                  return (
                    <div
                      key={uid}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.6rem',
                        borderRadius: '8px',
                        background: 'var(--bg-surface-elevated)'
                      }}
                    >
                      <div
                        onClick={() => {
                          setSocialModalType(null);
                          navigate(`/profile/${item.username}`);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', flex: 1, minWidth: 0, marginRight: '0.5rem' }}
                      >
                        <img
                          src={item.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.username}`}
                          alt={item.username}
                          style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--bg-surface)' }}
                        />
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.display_name || item.username}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            @{item.username}
                          </div>
                        </div>
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => handleToggleListFollow(uid)}
                          className={`btn ${item.is_following ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)' }}
                        >
                          {item.is_following ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Streak Modal */}
      <StreakModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        initialTab={modalTab}
      />
    </div>
  );
};
export default ProfilePage;
