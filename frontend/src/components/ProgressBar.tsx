import React from 'react';
import { cn } from '../lib/utils';

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  showText?: boolean;
  className?: string;
  barClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showText = false,
  className,
  barClassName,
  size = 'md',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      {showText && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-1">
          <span>Tiến độ</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', heightClasses[size])}>
        <div
          className={cn(
            'bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out',
            heightClasses[size],
            barClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
