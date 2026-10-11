import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Sparkles, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATION = 4000;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = DEFAULT_DURATION) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newToast: ToastItem = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, duration?: number) => showToast(message, 'success', duration),
    [showToast]
  );
  const error = useCallback(
    (message: string, duration?: number) => showToast(message, 'error', duration),
    [showToast]
  );
  const warning = useCallback(
    (message: string, duration?: number) => showToast(message, 'warning', duration),
    [showToast]
  );
  const info = useCallback(
    (message: string, duration?: number) => showToast(message, 'info', duration),
    [showToast]
  );

  const contextValue = useMemo(
    () => ({
      toasts,
      showToast,
      success,
      error,
      warning,
      info,
      removeToast,
    }),
    [toasts, showToast, success, error, warning, info, removeToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Render Container */}
      <div
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full px-4 sm:px-0 pointer-events-none"
        aria-live="polite"
        role="region"
      >
        {toasts.map((toast) => {
          let bgClass = 'bg-[#141C14]/95 border-[#283426] text-[#D2DFD1]';
          let icon = <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />;

          if (toast.type === 'success') {
            bgClass = 'bg-[#131D13]/95 border-[#28B110]/40 text-[#E1F3DF] shadow-[0_4px_20px_rgba(40,177,16,0.15)]';
            icon = <CheckCircle2 className="w-4 h-4 text-[#28B110] shrink-0" />;
          } else if (toast.type === 'error') {
            bgClass = 'bg-[#1C1314]/95 border-rose-500/40 text-rose-100 shadow-[0_4px_20px_rgba(244,63,94,0.15)]';
            icon = <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
          } else if (toast.type === 'warning') {
            bgClass = 'bg-[#1C1A13]/95 border-amber-500/40 text-amber-100 shadow-[0_4px_20px_rgba(245,158,11,0.15)]';
            icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
          } else if (toast.type === 'info') {
            bgClass = 'bg-[#13181D]/95 border-sky-500/40 text-sky-100 shadow-[0_4px_20px_rgba(14,165,233,0.15)]';
            icon = <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-xl p-3.5 border shadow-xl flex items-center justify-between gap-3 text-xs backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-2 ${bgClass}`}
              role="alert"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {icon}
                <span className="font-medium text-xs leading-relaxed break-words">{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-[#889887] hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                aria-label="Fechar notificação"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser utilizado dentro de um ToastProvider');
  }
  return context;
};
