import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TestResult } from '../types';
import { PronounceButton } from '../components/PronounceButton';

export const TestResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const result = (location.state as { result?: TestResult })?.result;

  React.useEffect(() => {
    if (result && result.score_percent >= 80) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [result]);

  if (!result) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy kết quả bài thi</h2>
        <button
          onClick={() => navigate('/test')}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Quay lại trang luyện thi
        </button>
      </div>
    );
  }

  const { score_percent, correct_answers, total_questions, results } = result;
  const wrongCount = total_questions - correct_answers;
  const isPassed = score_percent >= 70;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-lg ${
            isPassed
              ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-amber-500/20'
          }`}
        >
          <Award className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Kết quả bài kiểm tra
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {score_percent}%
          </h1>
          <p className="text-sm font-semibold text-slate-600">
            Đúng {correct_answers} trên tổng số {total_questions} câu
          </p>
        </div>

        {/* Quick info alert */}
        {wrongCount > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium text-left flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Lưu ý Spaced Repetition:</span> {wrongCount} từ bạn làm sai đã tự động được hệ thống đưa vào diện cần ôn tập khẩn cấp. Lịch ôn tập đã được xếp lại gần hơn để bạn khắc sâu kiến thức!
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/test"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
          >
            Làm bài test khác
          </Link>
          <Link
            to="/roadmap"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
          >
            <span>Quay về lộ trình học</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Detailed Answers Review */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Chi tiết từng câu hỏi ({results.length} câu)
        </h2>

        <div className="space-y-3">
          {results.map((ans, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-all ${
                ans.is_correct
                  ? 'bg-white border-emerald-200/80 shadow-sm'
                  : 'bg-red-50/40 border-red-200 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        ans.is_correct ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                    >
                      {ans.is_correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </span>
                    <span className="font-extrabold text-base text-slate-900">
                      {ans.word}
                    </span>
                    <PronounceButton
                      wordId={ans.word_id}
                      wordText={ans.word}
                      size="sm"
                    />
                  </div>

                  <div className="text-xs text-slate-500 font-medium">
                    Nghĩa chuẩn: <strong className="text-slate-800">{ans.meaning_vi}</strong>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-600">
                  Câu {idx + 1}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Câu trả lời của bạn:</span>
                  <span className={`font-semibold ${ans.is_correct ? 'text-emerald-700' : 'text-red-600'}`}>
                    {ans.user_answer || '(Chưa trả lời)'}
                  </span>
                </div>
                {!ans.is_correct && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">Đáp án đúng:</span>
                    <span className="font-semibold text-emerald-700">
                      {ans.correct_answer}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
