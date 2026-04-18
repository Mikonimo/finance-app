import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: number) => void;
}

let nextId = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message, duration = 4000) => {
    const id = nextId++;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Convenience functions
export const toast = {
  success: (message: string) => useToastStore.getState().addToast('success', message),
  error: (message: string) => useToastStore.getState().addToast('error', message, 6000),
  warning: (message: string) => useToastStore.getState().addToast('warning', message, 5000),
  info: (message: string) => useToastStore.getState().addToast('info', message),
};

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
  error: 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
};

function ToastItem({ toast: t, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (t.duration) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onRemove, 300);
      }, t.duration);
      return () => clearTimeout(timer);
    }
  }, [t.duration, onRemove]);

  const Icon = ICONS[t.type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300 ${STYLES[t.type]} ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm font-medium flex-1">{t.message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onRemove, 300);
        }}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  );
}
