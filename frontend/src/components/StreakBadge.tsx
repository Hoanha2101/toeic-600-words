import React from 'react';
import { Flame } from 'lucide-react';
import { cn } from '../lib/utils';

interface StreakBadgeProps {
  streak: number;
  compact?: boolean;
  className?: string;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  streak,
  compact = false,
  className,
}) => {
  return (
    <div
      title={streak > 0 ? `Chuỗi học liên tục: ${streak} ngày` : 'Bắt đầu chuỗi học mỗi ngày!'}
      className={cn(
        'inline-flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-400 font-extrabold text-xs shadow-sm transition-all',
        compact ? 'px-2.5 py-1 rounded-xl' : 'px-3 py-1 rounded-full',
        className
      )}
    >
      <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse flex-shrink-0" />
      <span>{compact ? `${streak}` : streak > 0 ? `${streak} ngày` : 'Streak 0'}</span>
    </div>
  );
};
