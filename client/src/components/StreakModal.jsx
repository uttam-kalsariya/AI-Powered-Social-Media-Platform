import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Flame, 
  Award, 
  Calendar, 
  Trophy, 
  CheckCircle2, 
  Lock, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export const StreakModal = ({ isOpen, onClose, initialTab = 'calendar' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [streakData, setStreakData] = useState(null);
  const [badgesCatalog, setBadgesCatalog] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  // Month navigation for visual calendar
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [streakRes, leaderRes] = await Promise.all([
        user ? api.streaks.getMyStreak().catch(() => ({})) : Promise.resolve({}),
        api.streaks.getLeaderboard(15).catch(() => ({ leaderboard: [] }))
      ]);

      if (streakRes.streak) setStreakData(streakRes.streak);
      if (streakRes.badges_catalog) setBadgesCatalog(streakRes.badges_catalog);
      if (leaderRes.leaderboard) setLeaderboard(leaderRes.leaderboard);
    } catch (err) {
      console.error("Failed to load streak modal data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      loadAllData();
    }
  }, [isOpen, initialTab, loadAllData]);

  const streak = streakData || {
    current_streak: 0,
    longest_streak: 0,
    total_active_days: 0,
    xp: 0,
    level: 1,
    level_title: 'Novice Explorer',
    unlocked_badges: [],
    active_dates: []
  };

  const unlockedBadgeIds = useMemo(() => {
    return new Set((streak.unlocked_badges || []).map(b => b.id));
  }, [streak.unlocked_badges]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Determine active days set
  const activeDatesSet = useMemo(() => new Set(streak.active_dates || []), [streak.active_dates]);
  const todayIsoDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
            }}>
              <Flame size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Streak Central & Rewards
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {streak.current_streak} Day Streak • Lvl {streak.level || 1} {streak.level_title || 'Novice'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 1rem',
          gap: '0.5rem',
          background: 'rgba(0, 0, 0, 0.15)'
        }}>
          {[
            { id: 'calendar', label: 'Activity Calendar', icon: Calendar },
            { id: 'badges', label: 'Badges & Trophies', icon: Award },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.75rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body / Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', color: 'var(--primary)' }}>
              <RefreshCw size={20} className="animate-spin" />
            </div>
          )}

          {/* TAB 1: CALENDAR */}
          {activeTab === 'calendar' && (
            <div>
              {/* Stat Summary Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Streak</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>
                    {streak.current_streak} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>days</span>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>All-Time Best</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ec4899', marginTop: '0.2rem' }}>
                    {streak.longest_streak || 0} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>days</span>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Active Days</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
                    {streak.total_active_days || (streak.active_dates ? streak.active_dates.length : 0)} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>days</span>
                  </div>
                </div>
              </div>

              {/* Month Navigation */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {monthNames[month]} {year}
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={prevMonth}
                    style={{
                      padding: '0.3rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={nextMonth}
                    style={{
                      padding: '0.3rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Calendar Days Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.4rem',
                textAlign: 'center',
                marginBottom: '0.4rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-muted)'
              }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.4rem'
              }}>
                {/* Blank days before month start */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ height: '38px' }} />
                ))}

                {/* Actual Month Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isActive = activeDatesSet.has(dateStr);
                  const isToday = todayIsoDate === dateStr;

                  return (
                    <div
                      key={dayNum}
                      style={{
                        height: '38px',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        fontWeight: isActive ? 700 : 500,
                        background: isActive 
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(239, 68, 68, 0.25))' 
                          : 'rgba(255, 255, 255, 0.02)',
                        border: isToday 
                          ? '1.5px solid var(--primary)' 
                          : isActive 
                            ? '1px solid rgba(245, 158, 11, 0.4)' 
                            : '1px solid var(--border-subtle)',
                        color: isActive ? '#f59e0b' : 'var(--text-secondary)',
                        position: 'relative'
                      }}
                    >
                      <span>{dayNum}</span>
                      {isActive && (
                        <Flame size={10} color="#f59e0b" style={{ position: 'absolute', bottom: '3px' }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.25rem',
                marginTop: '1.25rem',
                fontSize: '0.72rem',
                color: 'var(--text-muted)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.3)', border: '1px solid #f59e0b' }} />
                  <span>Active Streak Day</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1.5px solid var(--primary)' }} />
                  <span>Today</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BADGES & TROPHIES */}
          {activeTab === 'badges' && (
            <div>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Unlocked {streak.unlocked_badges ? streak.unlocked_badges.length : 0} of {badgesCatalog.length || 10} Trophies
                </span>
                <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>
                  +{streak.xp || 0} Total XP Earned
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '0.75rem'
              }}>
                {(badgesCatalog.length > 0 ? badgesCatalog : [
                  { id: 'first_flame', name: 'First Flame', description: 'Recorded your first day on Aura!', icon: '🔥', xp_reward: 20 },
                  { id: 'on_fire', name: 'On Fire', description: 'Maintained a 3-day daily streak', icon: '⚡', xp_reward: 50 },
                  { id: 'week_warrior', name: 'Week Warrior', description: 'Achieved a full 7-day active streak', icon: '🛡️', xp_reward: 100 },
                  { id: 'biweekly_beast', name: 'Unstoppable', description: 'Blazed through a 14-day consecutive streak', icon: '🌟', xp_reward: 250 },
                  { id: 'monthly_master', name: 'Streak Legend', description: 'Reached a legendary 30-day streak milestone', icon: '👑', xp_reward: 500 },
                  { id: 'first_post', name: 'Debut Creator', description: 'Shared your very first post on the platform', icon: '✍️', xp_reward: 25 },
                  { id: 'post_pro', name: 'Content Maven', description: 'Created 5 inspiring posts', icon: '🎨', xp_reward: 75 },
                  { id: 'community_spark', name: 'Discussion Starter', description: 'Contributed 5 meaningful comments to community posts', icon: '💬', xp_reward: 50 },
                  { id: 'century_club', name: 'Century Club', description: 'Earned your first 100 XP points', icon: '💎', xp_reward: 30 },
                  { id: 'aura_champion', name: 'Aura Champion', description: 'Earned 500 XP and unlocked elite status', icon: '🏆', xp_reward: 150 }
                ]).map(badge => {
                  const isUnlocked = unlockedBadgeIds.has(badge.id);

                  return (
                    <div
                      key={badge.id}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '12px',
                        background: isUnlocked ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: isUnlocked ? '1.5px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        opacity: isUnlocked ? 1 : 0.65
                      }}
                    >
                      <div style={{
                        fontSize: '1.6rem',
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isUnlocked ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        filter: isUnlocked ? 'none' : 'grayscale(100%)'
                      }}>
                        {badge.icon}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {badge.name}
                          </span>
                          {isUnlocked ? (
                            <CheckCircle2 size={15} color="#10b981" />
                          ) : (
                            <Lock size={13} color="var(--text-muted)" />
                          )}
                        </div>

                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0.35rem' }}>
                          {badge.description}
                        </div>

                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: isUnlocked ? '#f59e0b' : 'var(--text-muted)' }}>
                          +{badge.xp_reward} XP {isUnlocked && '• Claimed'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div>
              <div style={{ marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Top community members ranked by longest active daily streaks and XP milestones.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {leaderboard.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No leaderboard activity recorded yet. Start your streak today!
                  </div>
                ) : (
                  leaderboard.map((item, index) => {
                    const isMe = user && (item.user_id === user.id || item.username === user.username);
                    const rankMedal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

                    return (
                      <div
                        key={item.user_id || index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          background: isMe ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          border: isMe ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                        }}
                      >
                        {/* Rank and User */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, width: '28px', textAlign: 'center' }}>
                            {rankMedal}
                          </span>

                          <img
                            src={item.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.username}`}
                            alt={item.username}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {item.full_name || item.username}
                              </span>
                              {isMe && (
                                <span style={{
                                  fontSize: '0.62rem',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '999px',
                                  background: 'var(--primary)',
                                  color: '#fff'
                                }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Lvl {item.level} • {item.level_title}
                            </div>
                          </div>
                        </div>

                        {/* Streak & XP Stats */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem' }}>
                              <Flame size={14} />
                              <span>{item.current_streak}d</span>
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              Streak
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', minWidth: '55px' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {item.xp || 0}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              XP
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
