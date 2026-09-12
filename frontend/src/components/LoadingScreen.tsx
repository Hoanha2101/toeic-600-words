import React from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  error?: string | null;
  onRetry?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Đang khôi phục tiến độ học của bạn...',
  error = null,
  onRetry,
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
          <span className="text-3xl">📚</span>
        </div>

        <h1 className="text-xl font-bold tracking-tight mb-2">
          600 Essential Words for TOEIC
        </h1>

        {error ? (
          <div className="mt-4">
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-sm flex items-start space-x-3 text-left mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-semibold">Không thể tải tiến độ học</p>
                <p className="text-xs text-red-400 mt-1">{error}</p>
              </div>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Thử lại kết nối</span>
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex items-center justify-center space-x-3 text-slate-300 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              <p className="text-sm font-medium">{message}</p>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Tiến độ của bạn đang được đồng bộ bảo đảm không bao giờ bị mất dữ liệu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
