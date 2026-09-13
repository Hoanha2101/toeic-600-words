import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Search,
  CheckCircle2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { useLessons } from '../hooks/useLessons';
import { useWordProgress } from '../hooks/useWordProgress';
import { useAuth } from '../hooks/useAuth';
import { Word } from '../types';
import { PronounceButton } from '../components/PronounceButton';
import { ErrorBanner } from '../components/ErrorBanner';
import { cn } from '../lib/utils';

export const WordsBrowsePage: React.FC = () => {
  const { user } = useAuth();
  const { data: lessons } = useLessons();
  const { markKnown, batchMark, isBatchMarking } = useWordProgress();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedWordIds, setSelectedWordIds] = useState<number[]>([]);

  const parentRef = useRef<HTMLDivElement | null>(null);

  // Debounce search input to avoid firing requests on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<{ total: number; words: Word[] }>({
    queryKey: ['words', user?.id, selectedLesson, selectedStatus, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedLesson) params.set('lesson_id', selectedLesson);
      if (selectedStatus) params.set('status', selectedStatus);
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('limit', '600');
      return apiClient.get(`/api/words?${params.toString()}`);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const words = data?.words || [];

  const rowVirtualizer = useVirtualizer({
    count: words.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 54,
    overscan: 10,
  });

  const handleToggleSelectAll = () => {
    if (selectedWordIds.length === words.length && words.length > 0) {
      setSelectedWordIds([]);
    } else {
      setSelectedWordIds(words.map((w) => w.id));
    }
  };

  const handleToggleSelectWord = (id: number) => {
    setSelectedWordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchMark = (isKnown: boolean) => {
    if (selectedWordIds.length === 0) return;
    batchMark(
      { wordIds: selectedWordIds, isMarkedKnown: isKnown },
      {
        onSuccess: () => {
          setSelectedWordIds([]);
        },
      }
    );
  };

  const statusStyles: Record<string, string> = {
    new: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    learning: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300',
    learned: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300',
    mastered: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
  };

  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          Từ điển & Tra cứu
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Toàn bộ 600 Từ vựng TOEIC
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tra cứu, tìm kiếm nhanh và tùy chỉnh trạng thái đã thuộc hàng loạt (tối ưu mượt mà 60 FPS với Virtualization).
        </p>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-sm space-y-4 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo từ tiếng Anh hoặc nghĩa..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          {/* Lesson Filter */}
          <div>
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            >
              <option value="">Tất cả 50 bài học</option>
              {lessons?.map((l) => (
                <option key={l.id} value={l.id}>
                  Bài {l.lesson_number}: {l.title_en}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="new">Từ mới (New)</option>
              <option value="learning">Đang học (Learning)</option>
              <option value="learned">Đã học (Learned)</option>
              <option value="mastered">Đã thuộc vững (Mastered)</option>
            </select>
          </div>
        </div>

        {/* Batch actions bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center space-x-1.5 font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white min-h-[44px] py-1"
            >
              {selectedWordIds.length === words.length && words.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                Chọn tất cả {words.length > 0 ? `(${selectedWordIds.length}/${words.length})` : ''}
              </span>
            </button>
          </div>

          {selectedWordIds.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 dark:text-slate-400">Đã chọn {selectedWordIds.length} từ:</span>
              <button
                type="button"
                disabled={isBatchMarking}
                onClick={() => handleBatchMark(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition min-h-[40px]"
              >
                Đánh dấu đã thuộc
              </button>
              <button
                type="button"
                disabled={isBatchMarking}
                onClick={() => handleBatchMark(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 transition min-h-[40px]"
              >
                Bỏ đánh dấu
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Words Virtualized List */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 text-center animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mx-auto mb-4" />
          <div className="h-64 bg-slate-100 dark:bg-slate-700/50 rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorBanner
          title="Không thể tải danh sách từ vựng"
          message={error instanceof Error ? error.message : "Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng bấm Thử lại."}
          onRetry={() => refetch()}
          isRetrying={isFetching}
          isNetworkError={Boolean(error && (error as any).isNetworkError)}
        />
      ) : words.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500 dark:text-slate-400">
          <p className="font-bold text-base mb-1 text-slate-800 dark:text-slate-200">Không tìm thấy từ vựng nào khớp với bộ lọc</p>
          <p className="text-xs text-slate-400">Thử xóa từ khóa tìm kiếm hoặc chọn lại bài học / trạng thái khác.</p>
        </div>
      ) : (
        <div
          ref={parentRef}
          className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto max-h-[600px] overflow-y-auto transition-colors"
        >
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold shadow-sm">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Từ vựng (EN)</th>
                <th className="py-3.5 px-4">Loại từ</th>
                <th className="py-3.5 px-4">Nghĩa tiếng Việt</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Định nghĩa tiếng Anh</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-center">Đã thuộc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {paddingTop > 0 && (
                <tr style={{ height: `${paddingTop}px` }}>
                  <td colSpan={7} />
                </tr>
              )}
              {virtualItems.map((virtualRow) => {
                const w = words[virtualRow.index];
                if (!w) return null;
                const isSelected = selectedWordIds.includes(w.id);
                const isKnown = w.is_marked_known || w.status === 'mastered';

                return (
                  <tr
                    key={w.id}
                    className={cn(
                      'hover:bg-slate-50 dark:hover:bg-slate-700/30 transition h-[54px]',
                      isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                    )}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectWord(w.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <span>{w.word}</span>
                        <PronounceButton
                          key={`browse-${w.id}`}
                          wordId={w.id}
                          wordText={w.word}
                          audioUrl={w.audio_url}
                          size="sm"
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-semibold">
                      {w.part_of_speech || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-800 dark:text-emerald-400">
                      {w.meaning_vi}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 hidden md:table-cell max-w-xs truncate" title={w.definition_en}>
                      {w.definition_en || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider',
                          statusStyles[w.status || 'new'] || statusStyles.new
                        )}
                      >
                        {w.status || 'new'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          markKnown({
                            wordId: w.id,
                            isMarkedKnown: !isKnown,
                          })
                        }
                        className={cn(
                          'p-2.5 rounded-xl transition min-w-[40px] min-h-[40px] inline-flex items-center justify-center',
                          isKnown
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100'
                            : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                        )}
                        title={isKnown ? 'Bỏ đánh dấu thuộc' : 'Đánh dấu đã thuộc'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paddingBottom > 0 && (
                <tr style={{ height: `${paddingBottom}px` }}>
                  <td colSpan={7} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
