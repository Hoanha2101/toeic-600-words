import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  HelpCircle,
  Play,
  History,
  CheckCircle2,
  Volume2,
  Edit3,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { useLessons } from '../hooks/useLessons';
import { TestSession } from '../types';
import { cn } from '../lib/utils';

export const TestSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: lessons } = useLessons();

  const [scope, setScope] = useState<'lesson' | 'multi_lesson' | 'all' | 'learning_only'>('lesson');
  const [selectedLessonId, setSelectedLessonId] = useState<number>(1);
  const [testType, setTestType] = useState<string>('mixed');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStartTest = async () => {
    setIsCreating(true);
    setErrorMsg('');
    try {
      let lessonIds: number[] | undefined = undefined;
      if (scope === 'lesson') {
        lessonIds = [selectedLessonId];
      }

      const res = await apiClient.post<TestSession>('/api/tests', {
        scope,
        lesson_ids: lessonIds,
        test_type: testType,
        question_count: questionCount,
      });

      navigate(`/test/${res.id}`, { state: { session: res } });
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tạo bài test. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  const testTypesList = [
    { id: 'mixed', label: 'Trộn mọi dạng (Khuyên dùng)', icon: Shuffle, desc: 'Tổng hợp trắc nghiệm, nghe và điền từ' },
    { id: 'multiple_choice', label: 'Trắc nghiệm nghĩa (EN ➔ VI)', icon: CheckCircle2, desc: 'Cho từ tiếng Anh, chọn đúng nghĩa tiếng Việt' },
    { id: 'reverse', label: 'Trắc nghiệm ngược (VI ➔ EN)', icon: HelpCircle, desc: 'Cho nghĩa tiếng Việt, chọn đúng từ tiếng Anh' },
    { id: 'listening', label: 'Luyện nghe (Listening)', icon: Volume2, desc: 'Bấm nghe phát âm chuẩn và chọn từ' },
    { id: 'fill_blank', label: 'Điền từ / Gõ chính tả', icon: Edit3, desc: 'Nhìn nghĩa và gõ chính xác từ tiếng Anh' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Luyện thi & Kiểm tra
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tạo bài Test kiểm tra từ vựng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Đánh giá độ nhớ từ và tự động lên lịch ôn tập cho các câu trả lời sai.
          </p>
        </div>

        <Link
          to="/test/history"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition self-start sm:self-auto min-h-[44px]"
        >
          <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Lịch sử làm bài</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Configuration Form */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 sm:p-8 space-y-8 transition-colors">
        {/* Scope Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
            1. Chọn phạm vi từ vựng
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setScope('lesson')}
              className={cn(
                'p-4 rounded-2xl border-2 text-left transition min-h-[44px]',
                scope === 'lesson'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
              )}
            >
              <div className="text-sm font-bold">Một bài học cụ thể</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kiểm tra 1 bài trong 50 bài</div>
            </button>

            <button
              type="button"
              onClick={() => setScope('learning_only')}
              className={cn(
                'p-4 rounded-2xl border-2 text-left transition min-h-[44px]',
                scope === 'learning_only'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
              )}
            >
              <div className="text-sm font-bold">Chỉ từ đang học</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ôn lại các từ chưa thuộc vững</div>
            </button>

            <button
              type="button"
              onClick={() => setScope('all')}
              className={cn(
                'p-4 rounded-2xl border-2 text-left transition min-h-[44px]',
                scope === 'all'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
              )}
            >
              <div className="text-sm font-bold">Toàn bộ 600 từ</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Trộn ngẫu nhiên toàn khóa</div>
            </button>
          </div>

          {/* Sub options for Scope */}
          {scope === 'lesson' && lessons && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Chọn bài học:
              </label>
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(parseInt(e.target.value, 10))}
                className="w-full sm:w-80 px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-base font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              >
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    Bài {l.lesson_number}: {l.title_en} ({l.title_vi})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Test Type Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
            2. Chọn hình thức câu hỏi
          </label>
          <div className="space-y-2">
            {testTypesList.map((item) => {
              const Icon = item.icon;
              const isSelected = testType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTestType(item.id)}
                  className={cn(
                    'w-full flex items-center justify-between p-4 rounded-2xl border-2 text-left transition min-h-[44px]',
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn('p-2.5 rounded-xl', isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400')}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{item.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
                    </div>
                  </div>
                  <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center', isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 dark:border-slate-600')}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Count Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
            3. Số lượng câu hỏi
          </label>
          <div className="flex space-x-3">
            {[10, 15, 20].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setQuestionCount(num)}
                className={cn(
                  'flex-1 py-3.5 rounded-2xl border-2 font-bold text-sm transition min-h-[44px]',
                  questionCount === num
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                )}
              >
                {num} câu
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          disabled={isCreating}
          onClick={handleStartTest}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50 min-h-[48px]"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>{isCreating ? 'Đang tạo đề thi...' : 'Bắt đầu làm bài thi'}</span>
        </button>
      </div>
    </div>
  );
};
