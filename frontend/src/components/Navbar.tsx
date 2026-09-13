import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Map,
  RotateCcw,
  HelpCircle,
  BarChart3,
  Search,
  LogOut,
  Menu,
  X,
  BookOpen,
  Trophy,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserState } from '../hooks/useUserState';
import { useTheme } from '../hooks/useTheme';
import { StreakBadge } from './StreakBadge';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { userState } = useUserState();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dueCount = userState?.summary?.due_reviews_count || 0;
  const streak = userState?.streak_days || 0;

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
      badge: dueCount > 0 ? dueCount : undefined,
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

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/roadmap" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-800 dark:from-white dark:via-slate-200 dark:to-emerald-400 bg-clip-text text-transparent">
                600 TOEIC
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Spaced Repetition
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition min-h-[44px] ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-sm animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Side: Theme toggle & Streak & User */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <StreakBadge streak={streak} />

            <div className="flex items-center space-x-2 border-l pl-3 border-slate-200 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-[110px] truncate" title={user?.email || ''}>
                {user?.email || 'User'}
              </span>
              <button
                onClick={handleSignOut}
                title="Đăng xuất"
                className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 min-w-[44px] min-h-[44px] flex items-center justify-center transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile top action buttons */}
          <div className="flex md:hidden items-center space-x-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <StreakBadge streak={streak} />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1 shadow-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold min-h-[44px] ${
                  active
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 truncate max-w-[180px]">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
