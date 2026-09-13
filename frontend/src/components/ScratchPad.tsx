import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PenTool,
  Type,
  Trash2,
  Undo2,
  Eraser,
  X,
  Palette,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ScratchPadProps {
  wordId: number;
  wordText?: string;
  onClose?: () => void;
  className?: string;
  isMobileModal?: boolean;
}

type TabType = 'type' | 'draw';

export const ScratchPad: React.FC<ScratchPadProps> = ({
  wordId,
  wordText = '',
  onClose,
  className,
  isMobileModal = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('draw');
  const [textInput, setTextInput] = useState<string>('');

  // Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState<string>('#10b981'); // emerald
  const [brushSize, setBrushSize] = useState<number>(3);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Colors available
  const colors = [
    { label: 'Emerald', hex: '#10b981' },
    { label: 'Blue', hex: '#3b82f6' },
    { label: 'Red', hex: '#ef4444' },
    { label: 'Amber', hex: '#f59e0b' },
    { label: 'Dark', hex: '#1e293b' },
  ];

  // Reset scratch pad when wordId changes
  useEffect(() => {
    setTextInput('');
    clearCanvas(false);
  }, [wordId]);

  // Canvas resize and context setup
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    // Set resolution to match container size
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(280, rect.width);
    const height = Math.max(200, rect.height || 260);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'draw') {
      const timer = setTimeout(() => {
        initCanvas();
      }, 50);
      window.addEventListener('resize', initCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', initCanvas);
      };
    }
  }, [activeTab, initCanvas]);

  const saveStateToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), imgData]); // Keep last 15 states
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    const previousState = newHistory.pop();
    setHistory(newHistory);

    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const clearCanvas = (withConfirm = true) => {
    if (withConfirm) {
      const ok = window.confirm('Bạn có chắc chắn muốn xóa toàn bộ nét vẽ nháp không?');
      if (!ok) return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
  };

  // Pointer drawing events
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    saveStateToHistory();

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (isEraser) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = brushSize * 4;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
    }

    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    setIsDrawing(false);
  };

  const handleClearText = () => {
    if (!textInput.trim()) return;
    if (window.confirm('Bạn có chắc muốn xóa nội dung nháp chữ này không?')) {
      setTextInput('');
    }
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col',
        className
      )}
    >
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/80">
        <div className="flex items-center space-x-2">
          <div className="flex p-1 bg-slate-200/80 dark:bg-slate-700 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('draw')}
              className={cn(
                'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition',
                activeTab === 'draw'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Vẽ tay</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('type')}
              className={cn(
                'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition',
                activeTab === 'type'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Gõ chữ</span>
            </button>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
            Giấy nháp
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {activeTab === 'draw' && (
            <>
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0}
                title="Hoàn tác nét vẽ"
                className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => clearCanvas(true)}
                title="Xóa trắng bảng vẽ"
                className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {activeTab === 'type' && (
            <button
              type="button"
              onClick={handleClearText}
              disabled={!textInput.trim()}
              title="Xóa chữ"
              className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30 min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col p-4 relative min-h-[260px]">
        {activeTab === 'draw' ? (
          <div className="flex-1 flex flex-col space-y-3">
            {/* Draw Canvas */}
            <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900/90 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden relative touch-none cursor-crosshair min-h-[220px]">
              <canvas
                ref={canvasRef}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                className="w-full h-full block"
              />
              {history.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 dark:text-slate-600 text-xs font-medium">
                  Viết tay hoặc tập viết từ vựng tại đây...
                </div>
              )}
            </div>

            {/* Canvas Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
              {/* Tool (Pen vs Eraser) */}
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setIsEraser(false)}
                  className={cn(
                    'p-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 min-w-[44px] min-h-[44px] justify-center',
                    !isEraser
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                  )}
                  title="Bút vẽ"
                >
                  <PenTool className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEraser(true)}
                  className={cn(
                    'p-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 min-w-[44px] min-h-[44px] justify-center',
                    isEraser
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                  )}
                  title="Tẩy / Cọ xóa"
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>

              {/* Color picker */}
              {!isEraser && (
                <div className="flex items-center space-x-1.5">
                  {colors.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      className={cn(
                        'w-7 h-7 rounded-full transition-transform active:scale-90',
                        color === c.hex && 'ring-2 ring-offset-2 ring-emerald-500 scale-110'
                      )}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              )}

              {/* Brush size */}
              <div className="flex items-center space-x-1">
                {[2, 4, 8].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setBrushSize(size)}
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition min-w-[36px] min-h-[36px]',
                      brushSize === size
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    )}
                  >
                    <span
                      className="rounded-full bg-current"
                      style={{ width: `${size * 1.5}px`, height: `${size * 1.5}px` }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-2">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Tập đặt câu hoặc ghi chú cho từ "${wordText}"...`}
              className="flex-1 w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none min-h-[220px]"
            />
            <div className="flex justify-between items-center text-xs text-slate-400 px-1">
              <span>Tự động làm mới khi chuyển từ</span>
              <span>{textInput.length} ký tự</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
