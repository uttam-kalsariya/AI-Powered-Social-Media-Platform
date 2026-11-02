import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  KeyRound, 
  Mail, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Clock
} from 'lucide-react';

export const VerifyEmailPage = () => {
  const { verifyEmail, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialEmail = queryParams.get('email') || location.state?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');

  // 5-minute expiry countdown (300 seconds)
  const [expirySeconds, setExpirySeconds] = useState(300);
  // 60-second resend cooldown
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = useRef([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setExpirySeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    const newDigits = [...digits];

    if (cleanVal.length > 1) {
      const pastedDigits = cleanVal.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedDigits[i] || '';
      }
      setDigits(newDigits);
      const nextIdx = Math.min(pastedDigits.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setDigits(newDigits);

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fullCode = digits.join('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email.trim() || fullCode.length !== 6) {
      setError('Please provide your registered email and enter the full 6-digit verification code.');
      return;
    }

    if (expirySeconds === 0) {
      setError('Verification code has expired. Please request a new code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await verifyEmail(email.trim(), fullCode);
      setSuccess(res.message || 'Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1800);
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email.trim()) return;

    setResending(true);
    setError('');
    try {
      const res = await resendOtp(email.trim());
      setSuccess(res.message || 'A fresh 6-digit verification code has been sent to your email.');
      setCooldown(60);
      setExpirySeconds(300);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
        maxWidth: '460px',
        width: '100%',
        padding: '2.5rem 2.25rem',
        borderRadius: 'var(--radius-lg)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
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
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>
            Enter Confirmation Code
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '0.4rem' }}>
            Enter the 6-digit security code sent to {email ? <strong>{email}</strong> : 'your email address'}
          </p>
        </div>

        {/* Error Alert */}
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

        {/* Success Alert */}
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                6-Digit Security Code
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: expirySeconds < 60 ? '#f43f5e' : 'var(--text-muted)' }}>
                <Clock size={12} />
                <span>Expires in {formatTimer(expirySeconds)}</span>
              </div>
            </div>

            {/* Split 6-digit input boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={loading}
                  autoFocus={idx === 0}
                  className="input-field"
                  style={{
                    textAlign: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    padding: '0.7rem 0',
                    fontFamily: 'monospace'
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || fullCode.length !== 6 || expirySeconds === 0}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontWeight: 600
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Verifying code...</span>
              </>
            ) : (
              <>
                <span>Confirm & Activate Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Resend Cooldown Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          marginTop: '1.5rem',
          fontSize: '0.84rem',
          color: 'var(--text-secondary)'
        }}>
          <span>Didn't get the code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            style={{
              background: 'none',
              border: 'none',
              color: cooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
              fontWeight: 600,
              cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
              padding: 0
            }}
          >
            {resending ? 'Sending...' : cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend Code'}
          </button>
        </div>

        {/* Footer Navigation */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.85rem'
        }}>
          <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
export default VerifyEmailPage;
