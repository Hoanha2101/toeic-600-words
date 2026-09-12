import React from 'react';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak }) => {
  return (
    <div className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-orange-500/20 text-orange-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
      <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
      <span>{streak > 0 ? `${streak} ngày liên tiếp` : 'Bắt đầu streak'}</span>
    </div>
  );
};
