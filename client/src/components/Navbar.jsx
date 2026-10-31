import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Sparkles, 
  ShieldCheck, 
  Bell, 
  User, 
  LogOut, 
  Bot, 
  LayoutDashboard, 
  Home,
  CheckCircle,
  Clock
} from 'lucide-react';

export const Navbar = ({ currentTab, setCurrentTab, onOpenAuth, onOpenProfile }) => {
  const { user, isAdmin, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.notifications.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0.75rem 1.5rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        {/* Brand */}
        <div 
          onClick={() => setCurrentTab('feed')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Outfit' }}>Aura</span>
              <span className="badge badge-ai" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>AI Social</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setCurrentTab('feed')}
            className={`btn ${currentTab === 'feed' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
          >
            <Home size={16} />
            <span>Feed</span>
          </button>

          <button
            onClick={() => setCurrentTab('assistant')}
            className={`btn ${currentTab === 'assistant' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
          >
            <Bot size={16} />
            <span>AI Assistant</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`btn ${currentTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '0.5rem 0.9rem',
                fontSize: '0.85rem',
                borderColor: currentTab === 'admin' ? 'transparent' : 'rgba(217, 70, 239, 0.4)'
              }}
            >
              <LayoutDashboard size={16} />
              <span>Admin Dashboard</span>
              <span className="badge badge-admin" style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>Admin</span>
            </button>
          )}
        </nav>

        {/* Actions / Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          {user ? (
            <>
              {/* Notifications Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="btn btn-secondary"
                  style={{
                    padding: '0.55rem',
                    borderRadius: '50%',
                    position: 'relative',
                  }}
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'var(--accent-rose)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="glass-panel-elevated" style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    width: '320px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '0.75rem',
                    zIndex: 100,
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.6rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      paddingBottom: '0.5rem'
                    }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {isAdmin ? '🛡️ Admin & Login Alerts' : '🔔 Notifications'}
                      </span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead} 
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-cyan)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}
                        >
                          <CheckCircle size={12} /> Mark read
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id || n._id}
                          style={{
                            padding: '0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '0.4rem',
                            background: n.is_read ? 'rgba(255, 255, 255, 0.02)' : 'rgba(99, 102, 241, 0.1)',
                            borderLeft: n.type === 'login' ? '3px solid #f59e0b' : '3px solid #6366f1',
                            fontSize: '0.82rem'
                          }}
                        >
                          <div style={{ fontWeight: 600, color: n.type === 'login' ? '#fcd34d' : 'var(--text-primary)' }}>
                            {n.type === 'login' ? '🔑 User Login Alert' : n.sender_name}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            {n.message}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={10} />
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* User Profile Pill */}
              <div 
                onClick={onOpenProfile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.35rem 0.65rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                  alt={user.username}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1e293b' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.username}</span>
                {isAdmin ? (
                  <span className="badge badge-admin" style={{ fontSize: '0.6rem' }}>Admin</span>
                ) : (
                  <span className="badge badge-primary" style={{ fontSize: '0.6rem' }}>User</span>
                )}
              </div>

              {/* Logout Button */}
              <button 
                onClick={logout} 
                className="btn btn-secondary" 
                style={{ padding: '0.55rem', borderRadius: '50%' }}
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button onClick={onOpenAuth} className="btn btn-primary">
              <User size={16} />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
