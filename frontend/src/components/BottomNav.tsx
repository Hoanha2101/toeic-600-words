import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, RotateCcw, HelpCircle, Trophy, BarChart3 } from 'lucide-react';
import { useUserState } from '../hooks/useUserState';
import { cn } from '../lib/utils';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { userState } = useUserState();
  const dueCount = userState?.summary?.due_reviews_count || 0;

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
    { label: 'Thống kê', href: '/dashboard', icon: BarChart3 },
  ];

  const isActive = (path: string) => {
    if (path === '/roadmap' && (location.pathname === '/' || location.pathname === '/roadmap')) {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom,8px)] shadow-lg">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full min-w-[48px] min-h-[48px] py-1 transition-all relative',
                active
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5', active ? 'stroke-[2.5px]' : 'stroke-2')} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1">{item.label}</span>
              {active && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
