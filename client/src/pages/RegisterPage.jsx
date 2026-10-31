import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  Shield 
} from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await register(username.trim(), email.trim(), password, role);
      // Navigate to verification page with email
      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`, {
        state: {
          email: email.trim(),
          message: res.message || 'OTP verification code sent to your email.'
        }
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'var(--bg-main)'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '420px',
        width: '100%',
        padding: '2.5rem 2.25rem',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'var(--instagram-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            marginBottom: '0.85rem'
          }}>
            <Sparkles size={26} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>Sign Up</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '0.4rem' }}>
            Sign up to see photos and AI posts from friends
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#f43f5e',
            fontSize: '0.84rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="e.g. johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
                disabled={loading}
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              Account Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`btn ${role === 'user' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.82rem', padding: '0.5rem' }}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`btn ${role === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.82rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
              >
                <Shield size={14} />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '0.5rem',
              fontWeight: 600
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.86rem',
          color: 'var(--text-secondary)'
        }}>
          Have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;
