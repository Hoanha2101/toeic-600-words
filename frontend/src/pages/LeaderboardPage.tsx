import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy,
  Award,
  Medal,
  Flame,
  Clock,
  BookCheck,
  CheckCircle2,
  Sparkles,
  User,
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { LeaderboardResponse, LeaderboardItem } from '../types';
import { formatTime } from '../lib/utils';

type SortOption = 'words_learned' | 'words_mastered' | 'avg_test_score' | 'streak_days' | 'total_study_seconds';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<SortOption>('words_learned');

  const { data, isLoading } = useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard', sortBy, user?.id],
    queryFn: () => apiClient.get<LeaderboardResponse>(`/api/leaderboard?sort_by=${sortBy}&limit=50`),
    staleTime: 1000 * 60, // 1 minute
  });

  const tabs: { id: SortOption; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'words_learned', label: 'Từ đã thuộc', icon: BookCheck },
    { id: 'words_mastered', label: 'Thành thạo', icon: Award },
    { id: 'avg_test_score', label: 'Điểm test TB', icon: Trophy },
    { id: 'streak_days', label: 'Chuỗi ngày 🔥', icon: Flame },
    { id: 'total_study_seconds', label: 'Thời gian học', icon: Clock },
  ];

  const items = data?.items || [];
  const top1 = items[0];
  const top2 = items[1];
  const top3 = items[2];
  const myRank = data?.my_rank;

  const getAvatarLetter = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase() || 'U';
  };

  const getMetricValue = (item: LeaderboardItem, sort: SortOption) => {
    switch (sort) {
      case 'words_learned':
        return `${item.words_learned} từ`;
      case 'words_mastered':
        return `${item.words_mastered} từ`;
      case 'avg_test_score':
        return `${item.avg_test_score}%`;
      case 'streak_days':
        return `${item.streak_days} ngày`;
      case 'total_study_seconds':
        return formatTime(item.total_study_seconds);
      default:
        return `${item.words_learned} từ`;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-bold shadow-sm">
          <Trophy className="w-3.5 h-3.5" />
          <span>Vinh danh bảng vàng TOEIC</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Bảng Xếp Hạng Học Viên
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Cạnh tranh lành mạnh cùng các học viên khác để xây dựng thói quen học từ vựng mỗi ngày.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto no-scrollbar space-x-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = sortBy === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSortBy(tab.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-1 justify-center ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Top 3 Podium (Shown when at least 1 item is available) */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-xl mx-auto items-end pt-6 pb-2">
          {/* Top 2 (Silver) */}
          <div className="flex flex-col items-center">
            {top2 ? (
              <div className="flex flex-col items-center w-full space-y-2">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-slate-300 to-slate-400 text-slate-800 flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-white dark:border-slate-800">
                    {getAvatarLetter(top2.display_name)}
                  </div>
                  <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center border-2 border-white shadow">
                    2
                  </span>
                </div>
                <div className="text-center w-full">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate px-1">
                    {top2.display_name}
                  </p>
                  <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                    {getMetricValue(top2, sortBy)}
                  </p>
                </div>
                <div className="w-full h-16 sm:h-20 bg-slate-200 dark:bg-slate-700 rounded-t-2xl flex items-center justify-center text-slate-400 font-extrabold text-sm">
                  🥈
                </div>
              </div>
            ) : (
              <div className="w-full h-16 bg-slate-100 rounded-t-2xl" />
            )}
          </div>

          {/* Top 1 (Gold) */}
          <div className="flex flex-col items-center">
            {top1 && (
              <div className="flex flex-col items-center w-full space-y-2">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-xl shadow-amber-500/30 border-2 border-white dark:border-slate-800 animate-pulse">
                    {getAvatarLetter(top1.display_name)}
                  </div>
                  <span className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center border-2 border-white shadow">
                    👑
                  </span>
                </div>
                <div className="text-center w-full">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate px-1">
                    {top1.display_name}
                  </p>
                  <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                    {getMetricValue(top1, sortBy)}
                  </p>
                </div>
                <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-amber-500/20 to-amber-500/10 border-t-2 border-amber-400 rounded-t-2xl flex items-center justify-center text-amber-600 font-extrabold text-xl shadow-sm">
                  🥇
                </div>
              </div>
            )}
          </div>

          {/* Top 3 (Bronze) */}
          <div className="flex flex-col items-center">
            {top3 ? (
              <div className="flex flex-col items-center w-full space-y-2">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-800 text-amber-100 flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-white dark:border-slate-800">
                    {getAvatarLetter(top3.display_name)}
                  </div>
                  <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center border-2 border-white shadow">
                    3
                  </span>
                </div>
                <div className="text-center w-full">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate px-1">
                    {top3.display_name}
                  </p>
                  <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                    {getMetricValue(top3, sortBy)}
                  </p>
                </div>
                <div className="w-full h-12 sm:h-14 bg-amber-900/20 rounded-t-2xl flex items-center justify-center text-amber-700 font-extrabold text-sm">
                  🥉
                </div>
              </div>
            ) : (
              <div className="w-full h-12 bg-slate-100 rounded-t-2xl" />
            )}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Chưa có dữ liệu bảng xếp hạng.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {items.map((item) => {
              const isMe = item.is_current_user;
              return (
                <div
                  key={item.user_id}
                  className={`flex items-center justify-between p-4 sm:px-6 transition-all ${
                    isMe
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-l-4 border-emerald-500'
                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    {/* Rank Badge */}
                    <div className="w-8 text-center flex-shrink-0">
                      {item.rank === 1 ? (
                        <span className="text-xl">🥇</span>
                      ) : item.rank === 2 ? (
                        <span className="text-xl">🥈</span>
                      ) : item.rank === 3 ? (
                        <span className="text-xl">🥉</span>
                      ) : (
                        <span className="font-extrabold text-sm text-slate-400 dark:text-slate-500">
                          #{item.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm ${
                        isMe
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {getAvatarLetter(item.display_name)}
                    </div>

                    {/* User info */}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-bold text-sm truncate ${
                            isMe ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {item.display_name}
                        </span>
                        {isMe && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-[10px] font-extrabold flex-shrink-0">
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5">
                        <span>🔥 {item.streak_days} ngày</span>
                        <span>•</span>
                        <span>Đã học {item.words_learned} từ</span>
                      </div>
                    </div>
                  </div>

                  {/* Highlight Metric */}
                  <div className="text-right flex-shrink-0 ml-4">
                    <span
                      className={`text-base sm:text-lg font-black ${
                        isMe ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {getMetricValue(item, sortBy)}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                      {sortBy === 'words_learned' && 'Đã thuộc'}
                      {sortBy === 'words_mastered' && 'Mastered'}
                      {sortBy === 'avg_test_score' && 'Test TB'}
                      {sortBy === 'streak_days' && 'Streak'}
                      {sortBy === 'total_study_seconds' && 'Thời gian'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom My Rank Bar (When user is loaded) */}
      {myRank && (
        <div className="sticky bottom-4 bg-slate-900 dark:bg-slate-800 text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between z-20 backdrop-blur-md bg-opacity-95">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-black text-base flex items-center justify-center shadow-md shadow-emerald-500/30 flex-shrink-0">
              #{myRank.rank}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Thứ hạng của bạn
              </span>
              <span className="text-sm font-bold text-white truncate block">
                {myRank.display_name} (Bạn)
              </span>
            </div>
          </div>

          <div className="text-right flex-shrink-0 ml-4">
            <span className="text-lg font-black text-emerald-400">
              {getMetricValue(myRank, sortBy)}
            </span>
            <span className="block text-[10px] text-slate-400 font-semibold uppercase">
              {sortBy === 'words_learned' && 'Đã thuộc'}
              {sortBy === 'words_mastered' && 'Mastered'}
              {sortBy === 'avg_test_score' && 'Test TB'}
              {sortBy === 'streak_days' && 'Streak'}
              {sortBy === 'total_study_seconds' && 'Thời gian'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
