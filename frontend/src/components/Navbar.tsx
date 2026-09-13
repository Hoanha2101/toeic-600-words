import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Map,
  RotateCcw,
  HelpCircle,
  BarChart3,
  Search,
  LogOut,
  BookOpen,
  Trophy,
  Sun,
  Moon,
  ChevronDown,
  User as UserIcon,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserState } from '../hooks/useUserState';
import { useTheme } from '../hooks/useTheme';
import { StreakBadge } from './StreakBadge';
import { cn } from '../lib/utils';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { userState } = useUserState();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const dueCount = userState?.summary?.due_reviews_count || 0;
  const streak = userState?.streak_days || 0;
  const wordsLearned = (userState?.summary?.words_learned || 0) + (userState?.summary?.words_mastered || 0);

  // Close dropdown on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { label: 'Lộ trình', href: '/roadmap', icon: Map },
    {
      label: 'Ôn tập',
      href: '/review',
      icon: RotateCcw,
      badge: dueCount > 0 ? (dueCount > 99 ? '99+' : dueCount) : undefined,
    },
    { label: 'Luyện thi', href: '/test', icon: HelpCircle },
    { label: 'Xếp hạng', href: '/leaderboard', icon: Trophy },
    { label: 'Tra cứu', href: '/words', icon: Search },
    { label: 'Thống kê', href: '/dashboard', icon: BarChart3 },
  ];

  const isActive = (path: string) => {
    if (path === '/roadmap' && (location.pathname === '/' || location.pathname === '/roadmap')) {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  // Avatar initial letter
  const userEmail = user?.email || '';
  const displayName = (user as any)?.user_metadata?.display_name || userEmail.split('@')[0] || 'User';
  const initialLetter = (displayName.charAt(0) || 'U').toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 flex-nowrap overflow-x-hidden">
          {/* LEFT: Logo & App Brand */}
          <Link to="/roadmap" className="flex items-center space-x-2.5 flex-shrink-0 min-h-[44px]">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-800 dark:from-white dark:via-slate-200 dark:to-emerald-400 bg-clip-text text-transparent">
                600 TOEIC
              </span>
              <span className="hidden xl:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Spaced Repetition
              </span>
            </div>
          </Link>

          {/* MIDDLE: Responsive Navigation */}
          {/* Tablet (md:flex lg:hidden): Icon-only with tooltips */}
          <nav className="hidden md:flex lg:hidden items-center space-x-1 flex-shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={item.label}
                  className={cn(
                    'relative p-2.5 rounded-xl transition min-w-[44px] min-h-[44px] flex items-center justify-center',
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className={cn('w-5 h-5', active && 'stroke-[2.5px]')} />
                  {item.badge !== undefined && (
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black bg-amber-500 text-white flex items-center justify-center shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop wide (lg:flex): Icon + Label */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5 flex-shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition min-h-[40px]',
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className={cn('w-4 h-4', active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="min-w-[20px] h-4 px-1 rounded-full text-[10px] font-black bg-amber-500 text-white flex items-center justify-center shadow-sm animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Theme Toggle + Streak + User Avatar Dropdown */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Streak Badge (Compact icon + number: 🔥 2) */}
            <StreakBadge streak={streak} compact={true} />

            {/* Unified User Avatar & Menu Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={cn(
                  'flex items-center space-x-1.5 p-1 rounded-2xl border transition min-h-[44px]',
                  userMenuOpen
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
                title="Tài khoản"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xs flex items-center justify-center shadow-sm">
                  {initialLetter}
                </div>
                <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block', userMenuOpen && 'rotate-180')} />
              </button>

              {/* User Dropdown Popover */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Profile Card Header */}
                  <div className="flex items-center space-x-3 pb-3.5 border-b border-slate-100 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-base flex items-center justify-center shadow-md shadow-emerald-600/20 flex-shrink-0">
                      {initialLetter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {displayName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title={userEmail}>
                        {userEmail}
                      </p>
                    </div>
                  </div>

                  {/* Quick User Stats */}
                  <div className="grid grid-cols-2 gap-2 py-3 border-b border-slate-100 dark:border-slate-700 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                      <span className="text-base font-black text-slate-900 dark:text-white">{wordsLearned}</span>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Từ đã thuộc</span>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                      <span className="text-base font-black">🔥 {streak}</span>
                      <span className="block text-[10px] font-bold uppercase">Ngày liên tục</span>
                    </div>
                  </div>

                  {/* Navigation Links inside Dropdown (Especially useful on mobile/tablet) */}
                  <div className="py-2 space-y-0.5">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setUserMenuOpen(false)}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition min-h-[40px]',
                            active
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          )}
                        >
                          <div className="flex items-center space-x-2.5">
                            <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Logout Action */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition min-h-[44px]"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
