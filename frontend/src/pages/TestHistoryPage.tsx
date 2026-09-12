import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { History, Award, ArrowLeft, PlusCircle, Calendar } from 'lucide-react';
import { apiClient } from '../lib/api';
import { TestHistoryItem } from '../types';
import { useAuth } from '../hooks/useAuth';

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
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="h-48 bg-slate-200 rounded-3xl" />
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
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang luyện thi</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Lịch sử làm bài kiểm tra
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Xem lại điểm số và quá trình tiến bộ của bạn qua các bài test.
          </p>
        </div>

        <Link
          to="/test"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tạo bài test mới</span>
        </Link>
      </div>

      {/* History List */}
      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <History className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Chưa có bài kiểm tra nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Bạn chưa hoàn thành bài test nào. Hãy tạo một bài test 10-20 câu để kiểm tra trình độ từ vựng nhé!
          </p>
          <Link
            to="/test"
            className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
          >
            Bắt đầu làm bài test đầu tiên
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
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
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm ${
                        isPassed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.score_percent}%
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 capitalize">
                          {item.test_type === 'mixed'
                            ? 'Bài kiểm tra tổng hợp'
                            : `Kiểm tra ${item.test_type}`}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPassed
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isPassed ? 'Đạt' : 'Cần cố gắng'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
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
