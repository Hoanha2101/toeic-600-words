import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { History, Award, ArrowLeft, PlusCircle, Calendar } from 'lucide-react';
import { apiClient } from '../lib/api';
import { TestHistoryItem } from '../types';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

export const TestHistoryPage: React.FC = () => {
  const { user } = useAuth();

  const { data: history, isLoading } = useQuery<TestHistoryItem[]>({
    queryKey: ['test_history', user?.id],
    queryFn: () => apiClient.get<TestHistoryItem[]>('/api/tests/history'),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
        <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-3xl" />
      </div>
    );
  }

  const items = history || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/test"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang luyện thi</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Lịch sử làm bài kiểm tra
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Xem lại điểm số và quá trình tiến bộ của bạn qua các bài test.
          </p>
        </div>

        <Link
          to="/test"
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tạo bài test mới</span>
        </Link>
      </div>

      {/* History List */}
      {items.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-12 text-center space-y-4 shadow-sm">
          <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Chưa có bài kiểm tra nào</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Bạn chưa hoàn thành bài test nào. Hãy tạo một bài test 10-20 câu để kiểm tra trình độ từ vựng nhé!
          </p>
          <Link
            to="/test"
            className="inline-block px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs min-h-[44px]"
          >
            Bắt đầu làm bài test đầu tiên
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {items.map((item) => {
              const isPassed = item.score_percent >= 70;
              const dateStr = new Date(item.started_at).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0',
                        isPassed
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      )}
                    >
                      {item.score_percent}%
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                          {item.test_type === 'mixed'
                            ? 'Bài kiểm tra tổng hợp'
                            : `Kiểm tra ${item.test_type}`}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                            isPassed
                              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                          )}
                        >
                          {isPassed ? 'Đạt' : 'Cần cố gắng'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-400 dark:text-slate-500 mt-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{dateStr}</span>
                        </span>
                        <span>•</span>
                        <span>Đúng {item.correct_answers}/{item.total_questions} câu</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
