import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { StreakModal } from './StreakModal';
import { 
  Sparkles, 
  ShieldCheck, 
  Bell, 
  User, 
  LogOut, 
  Bot, 
  LayoutDashboard, 
  Home,
  CheckCircle,
  Clock,
  Compass,
  Film,
  MessageSquare,
  Sun,
  Moon,
  PlusSquare,
  Settings,
  Flame,
  X
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [showStreakModal, setShowStreakModal] = useState(false);

  const activePath = location.pathname;
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.notifications.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  };

  const fetchStreak = async () => {
    if (!user) return;
    try {
      const res = await api.streaks.getMyStreak();
      if (res && res.streak) {
        setStreakCount(res.streak.current_streak || 0);
      }
    } catch (e) {
      if (user.current_streak) setStreakCount(user.current_streak);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchStreak();
      const interval = setInterval(fetchNotifications, 12000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const navLinks = [
    { label: 'Feed', path: '/home', icon: Home },
    { label: 'Explore', path: '/explore', icon: Compass },
    { label: 'Reels', path: '/reels', icon: Film },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Aura AI', path: '/assistant', icon: Bot, isAi: true },
    ...(isAdmin ? [{ label: 'Admin', path: '/admin', icon: LayoutDashboard, isAdmin: true }] : []),
    { label: 'Profile', path: user ? `/profile/${user.username}` : '/login', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* ======================================================== */}
      {/* DESKTOP & TABLET LEFT SIDEBAR (Instagram Style)           */}
      {/* ======================================================== */}
      <aside className="hidden md:flex flex-col justify-between fixed left-0 top-0 bottom-0 z-40 w-16 lg:w-60 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] px-3 lg:px-4 py-5 select-none transition-all">
        {/* Top Brand Logo */}
        <div>
          <div 
            onClick={() => navigate('/home')}
            className="flex items-center gap-3 px-2 py-2 cursor-pointer mb-6 rounded-xl hover:bg-[var(--bg-card-hover)] transition"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--instagram-gradient)] flex items-center justify-center shrink-0 shadow-[var(--shadow-glow)]">
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div className="hidden lg:flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-xl tracking-tight text-[var(--text-primary)]">Aura</span>
                <span className="badge badge-ai text-[0.62rem] px-1.5 py-0.5">AI</span>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.path || (item.path === '/home' && activePath === '/');
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-sm transition text-left w-full ${
                    isActive 
                      ? 'bg-[var(--bg-surface-elevated)] font-bold text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                  title={item.label}
                >
                  <Icon 
                    size={20} 
                    className={isActive ? (item.isAi ? 'text-emerald-500' : 'text-[#0095F6]') : ''} 
                  />
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              );
            })}

            {/* Streak Counter Trigger in Sidebar */}
            {user && (
              <button
                onClick={() => setShowStreakModal(true)}
                className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-sm transition text-left w-full text-amber-500 hover:bg-[rgba(245,158,11,0.1)] group"
                title={`Daily Streak: ${streakCount} Days. Click for rewards & calendar`}
              >
                <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                  <Flame size={13} className={streakCount > 0 ? 'animate-pulse' : ''} />
                </div>
                <span className="hidden lg:inline font-bold">{streakCount}d Streak</span>
              </button>
            )}

            {/* Notifications Trigger in Sidebar */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-sm transition text-left w-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                title="Notifications"
              >
                <div className="relative">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#f43f5e] text-white text-[0.6rem] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:inline">Notifications</span>
              </button>

              {/* Notifications Popup */}
              {showNotifications && (
                <div className="glass-panel-elevated fixed md:absolute left-16 lg:left-full top-20 md:top-0 ml-2 w-80 max-h-[460px] overflow-y-auto p-3 z-50 rounded-xl shadow-2xl border border-[var(--border-subtle)]">
                  <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-[var(--border-subtle)]">
                    <span className="font-semibold text-sm text-[var(--text-primary)]">
                      {isAdmin ? '🛡️ Admin & Security' : '🔔 Notifications'}
                    </span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead} 
                          className="text-xs text-[#0095F6] flex items-center gap-1 hover:underline"
                        >
                          <CheckCircle size={12} /> Mark read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id || n._id}
                        className={`p-2.5 rounded-lg mb-1.5 text-xs ${
                          n.is_read ? 'bg-[var(--bg-surface)]' : 'bg-[rgba(0,149,246,0.08)]'
                        } border-l-2 ${n.type === 'login' ? 'border-amber-400' : 'border-[#0095F6]'}`}
                      >
                        <div className="font-semibold text-[var(--text-primary)]">
                          {n.type === 'login' ? '🔑 Login Security Alert' : n.sender_name}
                        </div>
                        <div className="text-[var(--text-secondary)] mt-0.5">{n.message}</div>
                        <div className="text-[0.65rem] text-[var(--text-muted)] mt-1 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom Actions: Theme Toggle, User Profile, Log Out */}
        <div className="flex flex-col gap-2 pt-4 border-t border-[var(--border-subtle)]">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <Sun size={19} className="text-amber-400 shrink-0" /> : <Moon size={19} className="text-indigo-500 shrink-0" />}
            <span className="hidden lg:inline">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* User Profile Card / Login Button */}
          {user ? (
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
              <div 
                onClick={() => navigate(`/profile/${user.username}`)}
                className="flex items-center gap-2 cursor-pointer overflow-hidden flex-1"
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                  alt={user.username}
                  className="w-8 h-8 rounded-full shrink-0 object-cover"
                />
                <div className="hidden lg:flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate text-[var(--text-primary)]">{user.username}</span>
                  <span className="text-[0.65rem] text-[var(--text-secondary)] capitalize">{user.role || 'Member'}</span>
                </div>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login', { replace: true });
                }}
                className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 rounded-lg transition"
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary w-full text-xs py-2"
            >
              <User size={15} />
              <span className="hidden lg:inline">Sign In</span>
            </button>
          )}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE TOP BAR (< 768px)                                  */}
      {/* ======================================================== */}
      <header className="md:hidden sticky top-0 z-40 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-4 py-2.5 flex items-center justify-between">
        <div 
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--instagram-gradient)] flex items-center justify-center">
            <Sparkles size={17} color="#ffffff" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight text-[var(--text-primary)]">Aura</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Streak Flame Pill */}
          {user && (
            <button
              onClick={() => setShowStreakModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)] text-amber-500 text-xs font-bold active:scale-95 transition"
              title="View Daily Streaks"
            >
              <Flame size={14} className="fill-amber-500 text-amber-500" />
              <span>{streakCount}</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
            title="Toggle Theme"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-500" />}
          </button>

          {/* Notifications */}
          {user && (
            <button
              onClick={() => navigate('/notifications')}
              className="p-2 rounded-full relative text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#f43f5e] text-white text-[0.55rem] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Messages */}
          {user && (
            <button
              onClick={() => navigate('/messages')}
              className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
            >
              <MessageSquare size={18} />
            </button>
          )}

          {/* Logout if on mobile */}
          {user && (
            <button
              onClick={async () => {
                await logout();
                navigate('/login', { replace: true });
              }}
              className="p-2 rounded-full text-[var(--text-secondary)] hover:text-rose-500"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (< 768px, Instagram Style)   */}
      {/* ======================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] px-2 py-2 flex items-center justify-around select-none">
        <button
          onClick={() => navigate('/home')}
          className={`p-2 rounded-xl flex flex-col items-center gap-0.5 ${
            activePath === '/home' || activePath === '/' ? 'text-[#0095F6]' : 'text-[var(--text-secondary)]'
          }`}
        >
          <Home size={22} />
        </button>

        <button
          onClick={() => navigate('/explore')}
          className={`p-2 rounded-xl flex flex-col items-center gap-0.5 ${
            activePath === '/explore' ? 'text-[#0095F6]' : 'text-[var(--text-secondary)]'
          }`}
        >
          <Compass size={22} />
        </button>

        <button
          onClick={() => navigate('/assistant')}
          className={`p-2 rounded-xl flex flex-col items-center gap-0.5 ${
            activePath === '/assistant' ? 'text-emerald-500' : 'text-[var(--text-secondary)]'
          }`}
          title="Aura AI"
        >
          <Bot size={22} />
        </button>

        <button
          onClick={() => navigate('/reels')}
          className={`p-2 rounded-xl flex flex-col items-center gap-0.5 ${
            activePath === '/reels' ? 'text-[#0095F6]' : 'text-[var(--text-secondary)]'
          }`}
        >
          <Film size={22} />
        </button>

        <button
          onClick={() => navigate(user ? `/profile/${user.username}` : '/login')}
          className={`p-1.5 rounded-full flex flex-col items-center ${
            activePath.startsWith('/profile') ? 'ring-2 ring-[#0095F6]' : ''
          }`}
        >
          {user ? (
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
              alt={user.username}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <User size={22} className="text-[var(--text-secondary)]" />
          )}
        </button>
      </nav>

      {/* Streak Details & Visual Calendar Modal */}
      <StreakModal 
        isOpen={showStreakModal} 
        onClose={() => setShowStreakModal(false)} 
      />
    </>
  );
};
export default Navbar;
