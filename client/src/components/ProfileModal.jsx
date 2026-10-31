import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, User, Save, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.users.updateProfile({ bio, avatar });
      updateUser(res.user);
      setMessage('Profile updated successfully!');
      setTimeout(() => {
        setMessage('');
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="glass-panel-elevated animate-fade-in" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '1.75rem',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>User Profile</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Manage your identity and appearance on Aura.
        </p>

        {error && (
          <div style={{
            padding: '0.6rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#fda4af',
            fontSize: '0.82rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            padding: '0.6rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#6ee7b7',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
        )}

        {/* Avatar preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <img
            src={avatar || user.avatar}
            alt="avatar preview"
            style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#1e293b', border: '2px solid var(--primary)' }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{user.username}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.email}</div>
            <button
              type="button"
              onClick={handleRandomAvatar}
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', marginTop: '0.4rem' }}
            >
              🎲 Generate New Avatar
            </button>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
              Avatar Image URL
            </label>
            <input
              type="url"
              className="input-field"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
              Bio & Interests
            </label>
            <textarea
              className="textarea-field"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others what you build and share..."
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
