import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Users, 
  ShieldAlert, 
  FileText, 
  MessageSquare, 
  Activity, 
  LogIn, 
  Trash2, 
  CheckCircle, 
  RefreshCw,
  Search,
  Database,
  Ban,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'moderation' | 'activity'
  const [loading, setLoading] = useState(true);

  // Users tab state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  
  // Moderation tab state
  const [posts, setPosts] = useState([]);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  
  // Activity tab state
  const [activities, setActivities] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, postsRes, actRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getUsers(),
        api.admin.getPosts(flaggedOnly),
        api.admin.getActivity()
      ]);
      setStats(statsRes.stats);
      setUsers(usersRes.users || []);
      setPosts(postsRes.posts || []);
      setActivities(actRes.activities || []);
    } catch (e) {
      console.error("Failed to load admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [flaggedOnly]);

  const handleToggleUserRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await api.admin.updateUser(user.id || user._id, { role: newRole });
      setUsers(prev => prev.map(u => (u.id === user.id || u._id === user._id) ? res.user : u));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleToggleUserBan = async (user) => {
    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    try {
      const res = await api.admin.updateUser(user.id || user._id, { status: newStatus });
      setUsers(prev => prev.map(u => (u.id === user.id || u._id === user._id) ? res.user : u));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Admin: Permanently delete this post?")) return;
    try {
      await api.posts.deletePost(postId);
      setPosts(prev => prev.filter(p => (p.id || p._id) !== postId));
      if (stats) setStats({ ...stats, total_posts: Math.max(0, stats.total_posts - 1) });
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDismissFlag = async (postId) => {
    try {
      await api.admin.dismissFlag(postId);
      setPosts(prev => prev.map(p => (p.id === postId || p._id === postId) ? { ...p, is_flagged: false } : p));
      if (stats) setStats({ ...stats, flagged_posts: Math.max(0, stats.flagged_posts - 1) });
    } catch (e) {
      alert(e.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.8rem' }}>Admin Control Center</h1>
            <span className="badge badge-admin">Master View</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Monitor real-time platform metrics, user accounts, content moderation, and authentication alerts.
          </p>
        </div>

        <button onClick={fetchData} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          <RefreshCw size={15} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[
          { label: 'Total Users', value: stats?.total_users ?? '-', icon: Users, color: '#6366f1' },
          { label: 'Active Users', value: stats?.active_users ?? '-', icon: UserCheck, color: '#10b981' },
          { label: 'Total Posts', value: stats?.total_posts ?? '-', icon: FileText, color: '#06b6d4' },
          { label: 'Total Comments', value: stats?.total_comments ?? '-', icon: MessageSquare, color: '#8b5cf6' },
          { label: 'AI Flagged Posts', value: stats?.flagged_posts ?? '-', icon: ShieldAlert, color: '#f43f5e' },
          { label: '24h User Logins', value: stats?.recent_logins_24h ?? '-', icon: LogIn, color: '#f59e0b' },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-panel" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{card.label}</span>
                <div style={{ padding: '0.35rem', borderRadius: '8px', background: `${card.color}20` }}>
                  <Icon size={16} color={card.color} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit' }}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Database status banner */}
      {stats?.database_status && (
        <div className="glass-panel" style={{
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          fontSize: '0.82rem',
          borderLeft: '4px solid var(--accent-emerald)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Database size={16} color="var(--accent-emerald)" />
            <span>Database Engine: <strong>{stats.database_status.engine}</strong></span>
          </div>
          <span className="badge badge-success">Online & Healthy</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem',
        paddingBottom: '0.5rem'
      }}>
        {[
          { id: 'users', label: 'User Directory & Roles', icon: Users },
          { id: 'moderation', label: 'AI Content Moderation', icon: ShieldAlert },
          { id: 'activity', label: 'Platform Activity & Login Alerts', icon: Activity },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <h3 style={{ fontSize: '1.15rem' }}>Registered Users ({filteredUsers.length})</h3>
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search username or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>User</th>
                  <th style={{ padding: '0.75rem' }}>Email</th>
                  <th style={{ padding: '0.75rem' }}>Role</th>
                  <th style={{ padding: '0.75rem' }}>Verified</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Last Login</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id || u._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <img src={u.avatar} alt={u.username} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                      <span style={{ fontWeight: 600 }}>{u.username}</span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-primary'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {u.is_verified ? (
                        <span style={{ color: 'var(--accent-emerald)' }}>✓ Yes</span>
                      ) : (
                        <span style={{ color: 'var(--accent-amber)' }}>Pending</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${u.status === 'banned' ? 'badge-danger' : 'badge-success'}`}>
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                      {u.last_login ? new Date(u.last_login).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleToggleUserRole(u)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                          title="Toggle Admin / User"
                        >
                          {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleToggleUserBan(u)}
                          className={u.status === 'banned' ? 'btn btn-secondary' : 'btn btn-danger'}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                        >
                          {u.status === 'banned' ? 'Unban' : 'Ban'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CONTENT MODERATION */}
      {activeTab === 'moderation' && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Content Moderation Queue</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={flaggedOnly}
                onChange={(e) => setFlaggedOnly(e.target.checked)}
              />
              <span>Show AI Flagged Only ({stats?.flagged_posts || 0})</span>
            </label>
          </div>

          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No posts found for the selected filter.
            </div>
          ) : (
            posts.map(post => (
              <div
                key={post.id || post._id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: post.is_flagged ? 'rgba(244, 63, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: post.is_flagged ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)',
                  marginBottom: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <img src={post.author_avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                    <div>
                      <span style={{ fontWeight: 600 }}>{post.author_name}</span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(post.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {post.is_flagged ? (
                      <span className="badge badge-danger">
                        Flagged (Score: {post.toxicity_score})
                      </span>
                    ) : (
                      <span className="badge badge-success">Clean</span>
                    )}

                    {post.is_flagged && (
                      <button
                        onClick={() => handleDismissFlag(post.id || post._id)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        Dismiss Flag
                      </button>
                    )}

                    <button
                      onClick={() => handleDeletePost(post.id || post._id)}
                      className="btn btn-danger"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  {post.content}
                </div>

                {post.moderation_reason && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-rose)' }}>
                    Reason: {post.moderation_reason}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: ACTIVITY & LOGIN ALERTS */}
      {activeTab === 'activity' && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Platform Activity & Login Audit Log</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No activity logs recorded yet.
              </div>
            ) : (
              activities.map((act, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      padding: '0.4rem',
                      borderRadius: '8px',
                      background: act.event === 'user_login' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                      color: act.event === 'user_login' ? '#f59e0b' : '#6366f1'
                    }}>
                      <LogIn size={15} />
                    </div>
                    <div>
                      <span style={{ fontWeight: 600 }}>{act.username}</span>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>
                        {act.event === 'user_login' ? 'logged into the platform' : act.event}
                      </span>
                      <span className="badge badge-primary" style={{ fontSize: '0.65rem', marginLeft: '0.5rem' }}>
                        {act.role}
                      </span>
                    </div>
                  </div>

                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {act.timestamp ? new Date(act.timestamp).toLocaleString() : 'Recent'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
