import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';

export const ResetPasswordPage = () => {
  const { resetPassword, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialEmail = queryParams.get('email') || location.state?.email || '';
  const initialToken = queryParams.get('token') || queryParams.get('code') || location.state?.token || '';

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Please enter your email address first.');
      return;
    }
    setResending(true);
    setError('');
    try {
      const res = await forgotPassword(email.trim());
      setSuccess(res.message || 'New reset code dispatched! Check your inbox or spam.');
      const code = res.reset_token || res.dev_reset_token;
      if (code) {
        setToken(code);
      }
    } catch (err) {
      setError(err.message || 'Unable to dispatch reset code.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !token.trim() || !newPassword) {
      setError('Please provide your email, reset token, and new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await resetPassword(email.trim(), token.trim(), newPassword);
      setSuccess(res.message || 'Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1800);
    } catch (err) {
      setError(err.message || 'Password reset failed. Please check your token.');
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
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
            <Lock size={26} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>Set New Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '0.4rem' }}>
            Choose a strong password to protect your account
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

        {success && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#10b981',
            fontSize: '0.84rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Reset Code / Token
              </label>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {resending ? 'Sending...' : "Didn't get code? Resend"}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Enter 6-digit reset code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
                disabled={loading}
                required
              />
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem', marginBottom: 0 }}>
              💡 Note: If email doesn't appear in your inbox within 1 minute, check your <strong>Spam / Junk</strong> folder.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              New Password (min 6 characters)
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
                disabled={loading}
                required
                minLength={6}
              />
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
                <span>Updating password...</span>
              </>
            ) : (
              <>
                <span>Set New Password</span>
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
          fontSize: '0.86rem'
        }}>
          Back to{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
export default ResetPasswordPage;
