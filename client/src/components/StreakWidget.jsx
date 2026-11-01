import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Flame, 
  Trophy, 
  Zap, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Award, 
  ChevronRight,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export const StreakWidget = ({ onOpenModal, onStreakUpdated }) => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  const fetchStreak = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.streaks.getMyStreak();
      setStreakData(res.streak || null);
    } catch (err) {
      console.error("Failed to load streak status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, [user]);

  const handleClaimCheckin = async () => {
    if (claiming) return;
    setClaiming(true);
    setNotificationMsg('');
    try {
      const res = await api.streaks.claimCheckin();
      setClaimSuccess(true);
      setNotificationMsg(res.message || 'Check-in claimed successfully!');
      if (res.streak) {
        setStreakData(res.streak);
      } else {
        await fetchStreak();
      }
      if (onStreakUpdated) onStreakUpdated(res);
      setTimeout(() => setClaimSuccess(false), 4000);
    } catch (err) {
      console.error("Check-in error:", err);
      setNotificationMsg(err.message || 'Failed to claim daily check-in.');
    } finally {
      setClaiming(false);
    }
  };

  if (!user) {
    return (
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1rem', textAlign: 'center' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 0.75rem',
          color: '#f59e0b'
        }}>
          <Flame size={24} />
        </div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Daily Activity Streaks</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.4rem 0 0.85rem' }}>
          Sign in to track your daily streaks, level up your creator rank, and earn exclusive milestone badges.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border-subtle)', animation: 'pulse 1.5s infinite' }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: '60%', height: '14px', background: 'var(--border-subtle)', borderRadius: '4px', marginBottom: '6px' }} />
            <div style={{ width: '40%', height: '10px', background: 'var(--border-subtle)', borderRadius: '4px' }} />
          </div>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--border-subtle)', borderRadius: '4px' }} />
      </div>
    );
  }

  const streak = streakData || {
    current_streak: 0,
    longest_streak: 0,
    xp: 0,
    level: 1,
    level_title: 'Novice Explorer',
    today_activities: { login: true, checkin_claimed: false, post_created: false, comment_created: false },
    weekly_progress: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
    level_info: { level: 1, title: 'Novice Explorer', current_xp: 0, next_level_xp: 100, xp_to_next_level: 100, progress_percentage: 0 }
  };

  const levelInfo = streak.level_info || {
    level: streak.level || 1,
    title: streak.level_title || 'Novice Explorer',
    current_xp: streak.xp || 0,
    next_level_xp: 100,
    progress_percentage: Math.min(100, (streak.xp || 0))
  };

  const todayAct = streak.today_activities || {};
  const isCheckedIn = todayAct.checkin_claimed;
  const days = [
    { key: 'mon', label: 'M' },
    { key: 'tue', label: 'T' },
    { key: 'wed', label: 'W' },
    { key: 'thu', label: 'T' },
    { key: 'fri', label: 'F' },
    { key: 'sat', label: 'S' },
    { key: 'sun', label: 'S' }
  ];

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow for active streaks */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Header: Flame & Streaks */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: streak.current_streak > 0 
              ? 'linear-gradient(135deg, #f59e0b, #ef4444)' 
              : 'rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: streak.current_streak > 0 ? '0 4px 14px rgba(245, 158, 11, 0.35)' : 'none'
          }}>
            <Flame size={20} className={streak.current_streak > 0 ? 'animate-bounce' : ''} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {streak.current_streak} {streak.current_streak === 1 ? 'Day' : 'Days'}
              </span>
              {streak.current_streak > 0 && (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '999px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  Active
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Best: {streak.longest_streak || 0}d record
            </div>
          </div>
        </div>

        {/* Action button to open full calendar modal */}
        <button
          onClick={onOpenModal}
          title="Open Visual Calendar & Badges"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.35rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Calendar size={18} />
        </button>
      </div>

      {/* Level & XP Progression */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '10px',
        padding: '0.75rem',
        border: '1px solid var(--border-subtle)',
        marginBottom: '0.85rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Zap size={14} color="#f59e0b" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Lvl {levelInfo.level}: {levelInfo.title}
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {streak.xp || 0} XP
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '999px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${levelInfo.progress_percentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
            borderRadius: '999px',
            transition: 'width 0.4s ease'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          <span>{levelInfo.progress_percentage}%</span>
          <span>{levelInfo.xp_to_next_level > 0 ? `${levelInfo.xp_to_next_level} XP to Lvl ${levelInfo.level + 1}` : 'Max Tier'}</span>
        </div>
      </div>

      {/* 7-Day Weekly Streak Dots */}
      <div style={{ marginBottom: '0.85rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
          This Week
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.2rem' }}>
          {days.map((d) => {
            const isCompleted = streak.weekly_progress && streak.weekly_progress[d.key];
            return (
              <div key={d.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{d.label}</span>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isCompleted ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'rgba(255, 255, 255, 0.05)',
                  border: isCompleted ? 'none' : '1px solid var(--border-subtle)',
                  color: isCompleted ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.75rem'
                }}>
                  {isCompleted ? <Flame size={13} /> : '•'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Daily Missions */}
      <div style={{ marginBottom: '0.85rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
          Today's Missions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.76rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {todayAct.login ? <CheckCircle2 size={14} color="#10b981" /> : <Circle size={14} color="var(--text-muted)" />}
              <span style={{ color: todayAct.login ? 'var(--text-primary)' : 'var(--text-muted)' }}>Daily Login</span>
            </div>
            <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>+10 XP</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {todayAct.post_created ? <CheckCircle2 size={14} color="#10b981" /> : <Circle size={14} color="var(--text-muted)" />}
              <span style={{ color: todayAct.post_created ? 'var(--text-primary)' : 'var(--text-muted)' }}>Publish a Post</span>
            </div>
            <span style={{ fontSize: '0.68rem', color: '#6366f1', fontWeight: 600 }}>+25 XP</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {todayAct.comment_created ? <CheckCircle2 size={14} color="#10b981" /> : <Circle size={14} color="var(--text-muted)" />}
              <span style={{ color: todayAct.comment_created ? 'var(--text-primary)' : 'var(--text-muted)' }}>Comment on a Post</span>
            </div>
            <span style={{ fontSize: '0.68rem', color: '#ec4899', fontWeight: 600 }}>+15 XP</span>
          </div>
        </div>
      </div>

      {/* Claim Check-in CTA */}
      <button
        onClick={handleClaimCheckin}
        disabled={isCheckedIn || claiming}
        className={isCheckedIn ? 'btn btn-secondary' : 'btn btn-primary'}
        style={{
          width: '100%',
          padding: '0.55rem',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          borderRadius: '8px',
          background: isCheckedIn ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
          border: isCheckedIn ? '1px solid var(--border-subtle)' : 'none',
          color: isCheckedIn ? 'var(--text-muted)' : '#fff',
          cursor: isCheckedIn ? 'default' : 'pointer'
        }}
      >
        <Sparkles size={14} />
        <span>{isCheckedIn ? 'Checked-In for Today' : (claiming ? 'Claiming...' : 'Claim Daily Check-In (+15 XP)')}</span>
      </button>

      {/* Toast Notification message */}
      {notificationMsg && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.4rem 0.6rem',
          borderRadius: '6px',
          background: claimSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: claimSuccess ? '#10b981' : '#ef4444',
          fontSize: '0.72rem',
          textAlign: 'center',
          border: `1px solid ${claimSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          {notificationMsg}
        </div>
      )}

      {/* Footer trigger to open modal */}
      <div 
        onClick={onOpenModal}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '0.85rem',
          paddingTop: '0.65rem',
          borderTop: '1px solid var(--border-subtle)',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: '0.74rem'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Award size={13} color="#f59e0b" />
          <span>{streak.unlocked_badges ? streak.unlocked_badges.length : 0} Badges Earned</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <span>Leaderboard</span>
          <ArrowUpRight size={13} />
        </div>
      </div>
    </div>
  );
};

