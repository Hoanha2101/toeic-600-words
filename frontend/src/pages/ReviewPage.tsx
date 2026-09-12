import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RotateCcw,
  Award,
  CheckCircle2,
  Sparkles,
  Clock,
  CalendarCheck,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useReviewQueue } from '../hooks/useReviewQueue';
import { useWordProgress } from '../hooks/useWordProgress';
import { useUserState } from '../hooks/useUserState';
import { FlashcardView } from '../components/FlashcardView';
import { ProgressBar } from '../components/ProgressBar';
import { formatTime } from '../lib/utils';
import { Sm2Rating } from '../types';

export const ReviewPage: React.FC = () => {
  const { data: dueWords, isLoading, refetch } = useReviewQueue();
  const { reviewWord, isReviewing } = useWordProgress();
  const { updateState } = useUserState();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [reviewedStats, setReviewedStats] = useState<{
    total: number;
    again: number;
    hard: number;
    good: number;
    easy: number;
  }>({
    total: 0,
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  // Track study time timer
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isFinished]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto" />
        <div className="h-80 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  const words = dueWords || [];
  const totalDue = words.length;

  // Empty state: no words due for review today
  if (totalDue === 0 && !isFinished) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
          <CalendarCheck className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Tuyệt vời! Không có từ nào cần ôn hôm nay
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Bạn đã hoàn thành tất cả từ vựng đến hạn ôn tập theo Spaced Repetition. Hãy học thêm bài mới hoặc làm bài luyện thi!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            to="/roadmap"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
          >
            <span>Tiếp tục học bài mới</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/test"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
          >
            Làm bài trắc nghiệm
          </Link>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  const handleRate = (rating: Sm2Rating) => {
    if (!currentWord || isReviewing) return;

    // Send SM-2 rating to backend
    reviewWord({
      wordId: currentWord.id,
      rating,
    });

    setReviewedStats((prev) => ({
      ...prev,
      total: prev.total + 1,
      [rating]: prev[rating] + 1,
    }));

    if (currentIndex < totalDue - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Completed queue
      setIsFinished(true);
      // Sync accumulated study time to user state
      updateState({
        add_study_seconds: elapsedSeconds,
      });
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });
    }
  };

  const correctCount = reviewedStats.good + reviewedStats.easy;
  const accuracyPercent =
    reviewedStats.total > 0
      ? Math.round((correctCount / reviewedStats.total) * 100)
      : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Spaced Repetition Review</span>
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Title & Progress */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Ôn tập từ đến hạn hôm nay
        </h1>
        <p className="text-xs text-slate-500">
          Ưu tiên từ quá hạn lâu nhất • Ôn tập đúng lúc giúp chuyển vào trí nhớ dài hạn
        </p>

        {!isFinished && (
          <div className="max-w-md mx-auto space-y-1 pt-2">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>Đang ôn: {currentIndex + 1} / {totalDue} từ</span>
              <span>{Math.round(((currentIndex + 1) / totalDue) * 100)}%</span>
            </div>
            <ProgressBar value={currentIndex + 1} max={totalDue} size="sm" />
          </div>
        )}
      </div>

      {/* Main Flashcard or Summary Screen */}
      {isFinished ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Tuyệt đỉnh! Đã hoàn thành ôn tập
            </h2>
            <p className="text-sm text-slate-500">
              Toàn bộ {reviewedStats.total} từ đã được cập nhật lịch ôn tập kế tiếp.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-2xl font-extrabold text-slate-900">{reviewedStats.total}</div>
              <div className="text-xs font-semibold text-slate-500">Từ đã ôn</div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="text-2xl font-extrabold text-emerald-600">{accuracyPercent}%</div>
              <div className="text-xs font-semibold text-emerald-700">Tỷ lệ nhớ đúng</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="text-2xl font-extrabold text-blue-600">{formatTime(elapsedSeconds)}</div>
              <div className="text-xs font-semibold text-blue-700">Thời gian ôn</div>
            </div>
          </div>

          {/* Anki Rating Breakdown */}
          <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto text-center">
            <div className="py-2 px-1 bg-red-50 rounded-xl">
              <span className="block text-sm font-bold text-red-600">{reviewedStats.again}</span>
              <span className="text-[10px] text-red-500 font-semibold">Quên</span>
            </div>
            <div className="py-2 px-1 bg-amber-50 rounded-xl">
              <span className="block text-sm font-bold text-amber-600">{reviewedStats.hard}</span>
              <span className="text-[10px] text-amber-500 font-semibold">Khó</span>
            </div>
            <div className="py-2 px-1 bg-blue-50 rounded-xl">
              <span className="block text-sm font-bold text-blue-600">{reviewedStats.good}</span>
              <span className="text-[10px] text-blue-500 font-semibold">Nhớ</span>
            </div>
            <div className="py-2 px-1 bg-emerald-50 rounded-xl">
              <span className="block text-sm font-bold text-emerald-600">{reviewedStats.easy}</span>
              <span className="text-[10px] text-emerald-500 font-semibold">Dễ</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/roadmap"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Quay về Lộ trình</span>
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
            >
              Xem Thống kê
            </Link>
          </div>
        </div>
      ) : currentWord ? (
        <FlashcardView
          word={currentWord}
          onRate={handleRate}
          isSubmitting={isReviewing}
        />
      ) : null}
    </div>
  );
};
