import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, Heart, MessageSquare, UserPlus, ShieldAlert, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const NotificationsPage = () => {
  const { isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.notifications.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={20} color="var(--primary)" />
            <span>Activity & Notifications</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            {unreadCount > 0 ? `You have ${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'You are all caught up!'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <CheckCircle size={14} color="var(--accent-cyan)" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
          <div>Loading activity updates...</div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Bell size={32} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
          <h3>No notifications yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            When someone likes your posts, comments, or connects, updates will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {notifications.map(n => {
            const isLogin = n.type === 'login';
            const isReg = n.type === 'registration';
            return (
              <div
                key={n.id || n._id}
                className="glass-panel"
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  borderLeft: isLogin ? '4px solid #f59e0b' : isReg ? '4px solid #10b981' : n.is_read ? '1px solid var(--border-subtle)' : '4px solid var(--primary)',
                  background: n.is_read ? 'var(--bg-card)' : 'rgba(99, 102, 241, 0.08)'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: isLogin ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isLogin ? <ShieldAlert size={18} color="#f59e0b" /> : <Bell size={18} color="var(--primary)" />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isLogin ? '#fcd34d' : 'var(--text-primary)' }}>
                    {isLogin ? 'Login Activity' : n.sender_name || 'System Notification'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={11} />
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default NotificationsPage;
