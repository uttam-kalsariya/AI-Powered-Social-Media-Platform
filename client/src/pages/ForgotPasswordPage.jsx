import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Mail, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  KeyRound
} from 'lucide-react';

export const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await forgotPassword(email.trim());
      setMessage(res.message || 'If this email is registered, password reset instructions have been dispatched.');
    } catch (err) {
      setError(err.message || 'Unable to process password reset request.');
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
            <KeyRound size={26} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>Trouble Logging In?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '0.4rem' }}>
            Enter your email and we'll send you a link or code to get back into your account.
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

        {message && (
          <div style={{
            padding: '1rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#10b981',
            fontSize: '0.86rem',
            marginBottom: '1.25rem',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              <CheckCircle2 size={18} />
              <span>Reset Code Dispatched</span>
            </div>
            <div>{message}</div>
            <button
              type="button"
              onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`, { state: { email } })}
              className="btn btn-primary"
              style={{ marginTop: '0.85rem', width: '100%', fontSize: '0.82rem', padding: '0.5rem' }}
            >
              <KeyRound size={14} />
              <span>Proceed to Set New Password</span>
            </button>
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Registered Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.4rem' }}
                  disabled={loading}
                  required
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
                  <span>Sending request...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Token</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        <div style={{
          textAlign: 'center',
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.86rem'
        }}>
          Remember your password?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
export default ForgotPasswordPage;
