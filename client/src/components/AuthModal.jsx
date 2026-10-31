import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  X, 
  Mail, 
  Lock, 
  User, 
  KeyRound, 
  ShieldCheck, 
  ArrowRight,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

export const AuthModal = ({ isOpen, onClose }) => {
  const { login, register, verifyEmail, forgotPassword, resetPassword } = useAuth();
  
  // Modes: 'login' | 'register' | 'verify' | 'forgot' | 'reset'
  const [mode, setMode] = useState('login');

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devCode, setDevCode] = useState('');

  if (!isOpen) return null;

  const resetMessages = () => {
    setError('');
    setSuccessMsg('');
    setDevCode('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      await login(email || username, password);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      const res = await register(username, email, password, role);
      setSuccessMsg(res.message || 'Registration successful! Verification code sent.');
      if (res.dev_verification_code) {
        setDevCode(res.dev_verification_code);
        setToken(res.dev_verification_code);
      }
      setMode('verify');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      const res = await verifyEmail(email, token);
      setSuccessMsg(res.message);
      setTimeout(() => {
        setMode('login');
        resetMessages();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      const res = await forgotPassword(email);
      setSuccessMsg(res.message);
      if (res.dev_reset_token) {
        setDevCode(res.dev_reset_token);
        setToken(res.dev_reset_token);
      }
      setMode('reset');
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      const res = await resetPassword(email, token, newPassword);
      setSuccessMsg(res.message);
      setTimeout(() => {
        setMode('login');
        resetMessages();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click Demo Logins for immediate testing
  const handleQuickDemo = async (demoRole) => {
    setLoading(true);
    resetMessages();
    try {
      if (demoRole === 'admin') {
        await login('admin', 'AdminPass123!');
      } else {
        await login('alex_innovator', 'UserPass123!');
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="glass-panel-elevated animate-fade-in" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2rem',
        position: 'relative'
      }}>
        {/* Close Button */}
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

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--primary-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            marginBottom: '0.5rem'
          }}>
            <Sparkles size={22} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.4rem' }}>
            {mode === 'login' && 'Welcome to Aura'}
            {mode === 'register' && 'Create Your Account'}
            {mode === 'verify' && 'Verify Your Email'}
            {mode === 'forgot' && 'Forgot Password'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {mode === 'login' && 'Sign in to access AI social tools and discussions.'}
            {mode === 'register' && 'Join the next-gen AI community with rich creator tools.'}
            {mode === 'verify' && 'Enter the 6-digit verification code.'}
            {mode === 'forgot' && 'Enter your email to receive a password reset token.'}
            {mode === 'reset' && 'Enter your token and choose a new password.'}
          </p>
        </div>

        {/* 1-Click Quick Demo Login Shortcuts */}
        {mode === 'login' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textAlign: 'center' }}>
              ⚡ Quick 1-Click Persona Demo:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', borderColor: 'rgba(217, 70, 239, 0.4)' }}
              >
                🛡️ Demo Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('user')}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
              >
                👤 Demo User
              </button>
            </div>
          </div>
        )}

        {/* Status / Dev messages */}
        {error && (
          <div style={{
            padding: '0.65rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#fda4af',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            border: '1px solid rgba(244, 63, 94, 0.3)'
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            padding: '0.65rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#6ee7b7',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {devCode && (
          <div style={{
            padding: '0.65rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(6, 182, 212, 0.15)',
            color: '#67e8f9',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            border: '1px solid rgba(6, 182, 212, 0.3)'
          }}>
            🔑 Dev Code (auto-filled): <strong>{devCode}</strong>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Email or Username
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="admin or user email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); resetMessages(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <ArrowRight size={16} />}
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); resetMessages(); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                Register
              </button>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Username
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Email Address
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Password (min 6 chars)
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Account Persona
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`btn ${role === 'user' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                >
                  👤 Standard User
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`btn ${role === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                >
                  🛡️ Administrator
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <ArrowRight size={16} />}
              <span>{loading ? 'Creating...' : 'Create Account'}</span>
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); resetMessages(); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* VERIFY FORM */}
        {mode === 'verify' && (
          <form onSubmit={handleVerify}>
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Email
              </label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Verification Code
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="6-digit code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                style={{ letterSpacing: '3px', textAlign: 'center', fontSize: '1.1rem' }}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              <span>{loading ? 'Verifying...' : 'Verify Email'}</span>
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <button
                type="button"
                onClick={() => { setMode('login'); resetMessages(); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Registered Email
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <KeyRound size={16} />}
              <span>{loading ? 'Sending...' : 'Send Reset Code'}</span>
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <button
                type="button"
                onClick={() => { setMode('login'); resetMessages(); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Email
              </label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Reset Code
              </label>
              <input
                type="text"
                className="input-field"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                style={{ letterSpacing: '2px', textAlign: 'center' }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                New Password (min 6 chars)
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              <span>{loading ? 'Resetting...' : 'Update Password'}</span>
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <button
                type="button"
                onClick={() => { setMode('login'); resetMessages(); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
