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

export const TestSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: lessons } = useLessons();

  const [scope, setScope] = useState<'lesson' | 'multi_lesson' | 'all' | 'learning_only'>('lesson');
  const [selectedLessonId, setSelectedLessonId] = useState<number>(1);
  const [selectedMultiLessonIds, setSelectedMultiLessonIds] = useState<number[]>([1, 2, 3]);
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
      } else if (scope === 'multi_lesson') {
        lessonIds = selectedMultiLessonIds;
      }

      const res = await apiClient.post<TestSession>('/api/tests', {
        scope,
        lesson_ids: lessonIds,
        test_type: testType,
        question_count: questionCount,
      });

      // Navigate to running test page with session data
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
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Luyện thi & Kiểm tra
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tạo bài Test kiểm tra từ vựng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Đánh giá độ nhớ từ và tự động lên lịch ôn tập cho các câu trả lời sai.
          </p>
        </div>

        <Link
          to="/test/history"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition self-start sm:self-auto"
        >
          <History className="w-4 h-4 text-slate-500" />
          <span>Lịch sử làm bài</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Configuration Form */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-8">
        {/* Scope Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-800">
            1. Chọn phạm vi từ vựng
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setScope('lesson')}
              className={`p-4 rounded-2xl border-2 text-left transition ${
                scope === 'lesson'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-sm font-bold">Một bài học cụ thể</div>
              <div className="text-xs text-slate-500 mt-1">Kiểm tra 1 bài trong 50 bài học</div>
            </button>

            <button
              type="button"
              onClick={() => setScope('learning_only')}
              className={`p-4 rounded-2xl border-2 text-left transition ${
                scope === 'learning_only'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-sm font-bold">Chỉ từ đang học (Learning)</div>
              <div className="text-xs text-slate-500 mt-1">Ôn lại các từ chưa thuộc vững</div>
            </button>

            <button
              type="button"
              onClick={() => setScope('all')}
              className={`p-4 rounded-2xl border-2 text-left transition ${
                scope === 'all'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-sm font-bold">Toàn bộ 600 từ (Tổng hợp)</div>
              <div className="text-xs text-slate-500 mt-1">Trộn ngẫu nhiên trên toàn khóa học</div>
            </button>

            <button
              type="button"
              onClick={() => setScope('multi_lesson')}
              className={`p-4 rounded-2xl border-2 text-left transition ${
                scope === 'multi_lesson'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-sm font-bold">Nhiều bài học cùng lúc</div>
              <div className="text-xs text-slate-500 mt-1">Chọn một cụm bài học liên tiếp</div>
            </button>
          </div>

          {/* Sub options for Scope */}
          {scope === 'lesson' && lessons && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Chọn bài học:
              </label>
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(parseInt(e.target.value, 10))}
                className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
          <label className="block text-sm font-bold text-slate-800">
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
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 text-left transition ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{item.label}</div>
                      <div className="text-xs text-slate-500">{item.desc}</div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Count Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-800">
            3. Số lượng câu hỏi
          </label>
          <div className="flex space-x-3">
            {[10, 15, 20].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setQuestionCount(num)}
                className={`flex-1 py-3 rounded-2xl border-2 font-bold text-sm transition ${
                  questionCount === num
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {num} câu
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          disabled={isCreating}
          onClick={handleStartTest}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>{isCreating ? 'Đang tạo đề test...' : 'Bắt đầu làm bài thi'}</span>
        </button>
      </div>
    </div>
  );
};
