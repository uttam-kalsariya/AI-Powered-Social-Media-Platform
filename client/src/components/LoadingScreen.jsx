import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';

export const LoadingScreen = ({ message = 'Verifying session...' }) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
      color: 'var(--text-primary)',
      padding: '2rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        background: 'var(--instagram-gradient)',
        boxShadow: 'var(--shadow-glow)',
        marginBottom: '1.25rem'
      }}>
        <Sparkles size={28} color="#ffffff" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
        <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--primary)' }} />
        <span>{message}</span>
      </div>
    </div>
  );
};
