import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Flame,
  Clock,
  BookOpen,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { DashboardSummary } from '../types';
import { formatTime } from '../lib/utils';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data: dashboard, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', user?.id],
    queryFn: () => apiClient.get<DashboardSummary>('/api/dashboard/summary'),
    enabled: !!user,
  });

  if (isLoading || !dashboard) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const {
    total_words,
    words_learned_or_mastered,
    overall_progress_percent,
    status_breakdown,
    streak_days,
    total_study_seconds,
    due_reviews_count,
    urgent_lessons,
  } = dashboard;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Thống kê học tập
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tiến độ & Hiệu suất học từ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dữ liệu được lưu trữ và khôi phục tự động qua Supabase Cloud.
          </p>
        </div>

        {due_reviews_count > 0 && (
          <Link
            to="/review"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition self-start sm:self-auto min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ôn tập ngay ({due_reviews_count} từ đến hạn)</span>
          </Link>
        )}
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Chuỗi ngày học
            </span>
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center">
              <Flame className="w-5 h-5 fill-orange-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              🔥 {streak_days} ngày
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Duy trì thói quen học mỗi ngày
            </div>
          </div>
        </div>

        {/* Mastered / Learned words */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Từ đã thuộc
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {words_learned_or_mastered} / {total_words}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Đạt {overall_progress_percent}% toàn bộ 50 bài
            </div>
          </div>
        </div>

        {/* Due count */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Cần ôn hôm nay
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {due_reviews_count} từ
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {due_reviews_count > 0 ? 'Đến lịch lặp lại ngắt quãng' : 'Đã ôn hết hôm nay'}
            </div>
          </div>
        </div>

        {/* Study Time */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Thời gian ôn
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {formatTime(total_study_seconds)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Thời gian tương tác học
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown by Status */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Phân bố trạng thái 600 từ vựng
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Theo quy trình Spaced Repetition (SM-2)
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            {overall_progress_percent}% Hoàn thành
          </span>
        </div>

        {/* Multi-segment visual bar */}
        <div className="w-full h-4 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex">
          <div
            style={{ width: `${(status_breakdown.mastered / total_words) * 100}%` }}
            className="bg-emerald-600 h-full transition-all duration-500"
            title={`Mastered: ${status_breakdown.mastered}`}
          />
          <div
            style={{ width: `${(status_breakdown.learned / total_words) * 100}%` }}
            className="bg-teal-400 h-full transition-all duration-500"
            title={`Learned: ${status_breakdown.learned}`}
          />
          <div
            style={{ width: `${(status_breakdown.learning / total_words) * 100}%` }}
            className="bg-amber-400 h-full transition-all duration-500"
            title={`Learning: ${status_breakdown.learning}`}
          />
          <div
            style={{ width: `${(status_breakdown.new / total_words) * 100}%` }}
            className="bg-slate-200 dark:bg-slate-600 h-full transition-all duration-500"
            title={`New: ${status_breakdown.new}`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Mastered</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">
              {status_breakdown.mastered}
            </div>
            <div className="text-[11px] text-emerald-800 dark:text-emerald-400 font-semibold">
              {Math.round((status_breakdown.mastered / total_words) * 100)}%
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-teal-400" />
              <span className="text-xs font-bold text-teal-900 dark:text-teal-300">Learned</span>
            </div>
            <div className="text-2xl font-extrabold text-teal-700 dark:text-teal-400 mt-2">
              {status_breakdown.learned}
            </div>
            <div className="text-[11px] text-teal-800 dark:text-teal-400 font-semibold">
              {Math.round((status_breakdown.learned / total_words) * 100)}%
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300">Learning</span>
            </div>
            <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-2">
              {status_breakdown.learning}
            </div>
            <div className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold">
              {Math.round((status_breakdown.learning / total_words) * 100)}%
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">New</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-700 dark:text-slate-200 mt-2">
              {status_breakdown.new}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              {Math.round((status_breakdown.new / total_words) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Lessons List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-4 transition-colors">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Bài học ưu tiên học tiếp
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Các bài học có từ cần ôn tập hoặc đang học dở
            </p>
          </div>
          <Link
            to="/roadmap"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center space-x-1 min-h-[44px]"
          >
            <span>Xem tất cả 50 bài</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {urgent_lessons.map((ul) => (
            <Link
              key={ul.lesson_id}
              to={`/lesson/${ul.lesson_id}/learn`}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md transition bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between min-h-[100px]"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Bài {ul.lesson_number}
                  </span>
                  {ul.due_count > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                      {ul.due_count} từ cần ôn
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{ul.title_en}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ul.title_vi}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>Đã thuộc: {ul.learned_words}/{ul.total_words}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {Math.round((ul.learned_words / ul.total_words) * 100)}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
