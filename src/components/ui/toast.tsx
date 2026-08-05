"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Check, X, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error";
type Toast = { id: number; message: string; kind: ToastKind };

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(
  () => {},
);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, kind }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      {/* `bottom-0` + `pb-safe` rather than `bottom-6`: on a gesture-bar phone
          a fixed 24px offset puts the toast under the home indicator. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-100 flex flex-col items-center gap-2 px-4 pb-safe [--pb-safe:1.5rem]"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              // Long server messages have to wrap inside the screen instead of
              // stretching the bar past both edges.
              "animate-fade-up pointer-events-auto flex w-full max-w-md items-start gap-3 border px-5 py-3 text-sm shadow-lg",
              "backdrop-blur-sm",
              toast.kind === "success"
                ? "border-line bg-surface-3 text-content"
                : "border-rust-500 bg-surface-3 text-rust-400",
            )}
          >
            {toast.kind === "success" ? (
              <Check size={16} className="mt-0.5 shrink-0 text-accent" />
            ) : (
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            )}
            <span className="min-w-0 flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() =>
                setToasts((current) =>
                  current.filter((item) => item.id !== toast.id),
                )
              }
              className="-my-1 -me-2 flex h-8 w-8 shrink-0 items-center justify-center text-content-faint transition-colors hover:text-content"
              aria-label="close"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
