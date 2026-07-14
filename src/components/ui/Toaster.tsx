"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  leaving?: boolean;
}

const ToastContext = createContext<{
  toast: (message: string, type?: ToastType) => void;
} | null>(null);

/** Fire-and-forget toast notifications: `const { toast } = useToast()`. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const ICONS: Record<ToastType, string> = { success: "✓", error: "✕", info: "ℹ" };
const ICON_STYLES: Record<ToastType, string> = {
  success: "bg-emerald-500 text-white",
  error: "bg-red-500 text-white",
  info: "bg-zinc-500 text-white",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 200);
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, message, type }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto flex max-w-sm animate-toast-in items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-lg transition-opacity dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 ${
              t.leaving ? "opacity-0" : "opacity-100"
            }`}
          >
            <span
              aria-hidden
              className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${ICON_STYLES[t.type]}`}
            >
              {ICONS[t.type]}
            </span>
            {t.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
