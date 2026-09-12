import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { playPronunciation } from '../lib/audio';
import { cn } from '../lib/utils';

interface PronounceButtonProps {
  wordId: number;
  wordText: string;
  audioUrl?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PronounceButton: React.FC<PronounceButtonProps> = ({
  wordId,
  wordText,
  audioUrl,
  className,
  size = 'md',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
    try {
      // If alt or shift key held, play slower (0.8x)
      const rate = e.shiftKey ? 0.75 : 1.0;
      await playPronunciation(wordId, wordText, audioUrl, rate);
    } catch (err) {
      console.warn('Audio play error:', err);
    } finally {
      setTimeout(() => setIsPlaying(false), 800);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Phát âm (Nhấn giữ Shift để đọc chậm)"
      aria-label={`Phát âm từ ${wordText}`}
      className={cn(
        'rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-95 transition-all shadow-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500/40',
        sizeClasses[size],
        isPlaying && 'scale-110 ring-4 ring-emerald-400/30 text-emerald-700 bg-emerald-200',
        className
      )}
    >
      <Volume2 className={cn(iconSizes[size], isPlaying && 'animate-bounce')} />
    </button>
  );
};
