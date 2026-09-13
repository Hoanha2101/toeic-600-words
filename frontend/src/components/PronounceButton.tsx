import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { playPronunciation } from '../lib/audio';
import { cn } from '../lib/utils';

interface PronounceButtonProps {
  wordId: number;
  wordText: string;
  audioUrl?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onPlay?: () => void;
}

export const PronounceButton: React.FC<PronounceButtonProps> = ({
  wordId,
  wordText,
  audioUrl,
  className,
  size = 'md',
  onPlay,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPlaying(true);
    if (onPlay) onPlay();

    try {
      const rate = e && e.shiftKey ? 0.75 : 1.0;
      await playPronunciation(wordId, wordText, audioUrl, rate);
    } catch (err) {
      console.warn('Audio play error:', err);
    } finally {
      setTimeout(() => setIsPlaying(false), 900);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2.5 text-sm',
    lg: 'p-3.5 text-base',
    xl: 'p-5 text-xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Soundwave Pulse Animation when playing */}
      {isPlaying && (
        <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
      )}
      <button
        type="button"
        onClick={handleClick}
        title="Phát âm (Phím Space hoặc L / Nhấn giữ Shift để đọc chậm)"
        aria-label={`Phát âm từ ${wordText}`}
        className={cn(
          'relative rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 active:scale-95 transition-all shadow-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[44px] min-w-[44px]',
          sizeClasses[size],
          isPlaying && 'scale-110 ring-4 ring-emerald-400/40 text-emerald-700 dark:text-emerald-200 bg-emerald-200 dark:bg-emerald-900',
          className
        )}
      >
        <Volume2 className={cn(iconSizes[size], isPlaying && 'animate-pulse text-emerald-600 dark:text-emerald-300')} />
      </button>
    </div>
  );
};
