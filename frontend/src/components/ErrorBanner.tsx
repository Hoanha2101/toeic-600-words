import React from 'react';
import { AlertCircle, RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface ErrorBannerProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
  isNetworkError?: boolean;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title,
  message,
  onRetry,
  isRetrying = false,
  className,
  isNetworkError = false,
}) => {
  const displayTitle = title || (isNetworkError ? 'Mất kết nối máy chủ' : 'Đã có lỗi xảy ra');
  const displayMessage =
    message ||
    (isNetworkError
      ? 'Không thể gửi dữ liệu đến máy chủ. Vui lòng kiểm tra kết nối Internet của bạn và bấm Thử lại.'
      : 'Hệ thống gặp sự cố tạm thời khi xử lý yêu cầu. Toàn bộ bài làm của bạn vẫn được lưu nguyên vẹn.');

  const IconComponent = isNetworkError ? WifiOff : AlertTriangle;

  return (
    <div
      className={cn(
        'rounded-3xl p-4 sm:p-5 border transition-all duration-200',
        'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60 shadow-sm',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm sm:text-base text-rose-900 dark:text-rose-200 tracking-tight">
              {displayTitle}
            </h4>
            <p className="text-xs sm:text-sm text-rose-700/90 dark:text-rose-300/90 font-medium leading-relaxed">
              {displayMessage}
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition active:scale-95 disabled:opacity-50 min-h-[44px] flex-shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
            <span>{isRetrying ? 'Đang thử lại...' : 'Thử lại ngay'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
