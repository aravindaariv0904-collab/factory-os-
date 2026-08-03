import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-white border-emerald-200 text-slate-900',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        };
      case 'error':
        return {
          bg: 'bg-white border-red-200 text-slate-900',
          icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
        };
      case 'warning':
        return {
          bg: 'bg-white border-amber-200 text-slate-900',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        };
      case 'info':
      default:
        return {
          bg: 'bg-white border-blue-200 text-slate-900',
          icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />
        };
    }
  };

  const style = getStyle();

  return (
    <div className={`pointer-events-auto p-3.5 rounded-xl border shadow-card flex items-start gap-3 transition-all duration-200 animate-in slide-in-from-bottom-2 ${style.bg}`}>
      {style.icon}
      <div className="flex-1 text-xs">
        <h4 className="font-semibold text-slate-900 leading-snug">{toast.title}</h4>
        {toast.description && <p className="text-slate-500 mt-0.5 leading-relaxed">{toast.description}</p>}
      </div>
      <button 
        onClick={() => onDismiss(toast.id)}
        className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
