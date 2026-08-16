import {
  AlertCircle,
  Bell,
  Check,
  Info,
  LoaderCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { EASE_OUT } from "../../../lib/ease";
import { cn } from "../../../lib/cn";

export type ToastStatus = "neutral" | "info" | "loading" | "success" | "error";
export type Toast = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  status?: ToastStatus;
  duration?: number;
};
type ToastInput = Omit<Toast, "id"> & { id?: string };

type ToastContextValue = {
  showToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
  success: (title: ReactNode, description?: ReactNode) => string;
  error: (title: ReactNode, description?: ReactNode) => string;
};

const ToastContext = createContext<ToastContextValue>({
  showToast: () => "",
  dismissToast: () => {},
  clearToasts: () => {},
  success: () => "",
  error: () => "",
});
const STATUS_ICON: Record<ToastStatus, LucideIcon> = {
  neutral: Bell,
  info: Info,
  loading: LoaderCircle,
  success: Check,
  error: AlertCircle,
};
const STATUS_CLASS: Record<ToastStatus, string> = {
  neutral: "bg-ink/5 text-muted",
  info: "bg-focus/10 text-focus",
  loading: "bg-focus/10 text-focus",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  error: "bg-danger/10 text-danger",
};
const STACK_SPRING: Transition = { type: "spring", stiffness: 420, damping: 34, mass: 0.75 };

let toastId = 0;

// This hook intentionally shares the provider's context from the same atom.
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((input: ToastInput) => {
    const toast: Toast = {
      duration: 4200,
      status: "neutral",
      ...input,
      id: input.id ?? `toast-${Date.now()}-${toastId++}`,
    };
    setToasts((current) => [...current, toast].slice(-4));
    if ((toast.duration ?? 0) > 0) {
      const timer = window.setTimeout(() => dismissToast(toast.id), toast.duration);
      timers.current.set(toast.id, timer);
    }
    return toast.id;
  }, [dismissToast]);

  const clearToasts = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
    setToasts([]);
  }, []);

  useEffect(() => () => clearToasts(), [clearToasts]);

  const value = useMemo<ToastContextValue>(() => ({
    showToast,
    dismissToast,
    clearToasts,
    success: (title, description) => showToast({ title, description, status: "success" }),
    error: (title, description) => showToast({ title, description, status: "error" }),
  }), [clearToasts, dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <AnimatedToastStack toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function AnimatedToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  const reduce = useReducedMotion();
  if (typeof document === "undefined") return null;
  return createPortal(
    <ol aria-live="polite" aria-atomic="false" className="pointer-events-none fixed bottom-6 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col-reverse gap-2">
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((toast, index) => {
          const status = toast.status ?? "neutral";
          const Icon = STATUS_ICON[status];
          return (
            <motion.li
              key={toast.id}
              layout
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.96, filter: "blur(10px)" }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: 32, scale: 0.96, filter: "blur(8px)", transition: { duration: 0.18, ease: EASE_OUT } }}
              transition={STACK_SPRING}
              className="pointer-events-auto relative"
              style={{ zIndex: 20 - index }}
            >
              <div className="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-line bg-surface/95 p-3 text-ink shadow-2xl backdrop-blur-xl">
                <span className={cn("mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full", STATUS_CLASS[status])}>
                  <Icon className={cn("h-3.5 w-3.5", status === "loading" && "animate-spin")} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-5 text-ink">{toast.title}</p>
                  {toast.description ? <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-muted">{toast.description}</p> : null}
                </div>
                <button type="button" aria-label="Dismiss toast" onClick={() => onDismiss(toast.id)} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-focus">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>,
    document.body,
  );
}
