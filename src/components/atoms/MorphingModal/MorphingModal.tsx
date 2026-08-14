import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../lib/cn";
import { EASE_OUT, SPRING_PANEL } from "../../../lib/ease";

export type MorphingModalProps = {
  children: ReactNode;
  className?: string;
  onClose: () => void;
  placement?: "bottom" | "center";
  viewId: string | null;
};

export function MorphingModal({
  children,
  className,
  onClose,
  placement = "bottom",
  viewId,
}: MorphingModalProps) {
  const open = viewId !== null;
  const reduce = useReducedMotion();
  const enterY = reduce ? 0 : placement === "bottom" ? 40 : 20;
  const enterScale = reduce ? 1 : 0.97;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-hidden={!open}
      inert={!open}
      className={cn("fixed inset-0 z-[80]", open ? "pointer-events-auto" : "pointer-events-none")}
    >
      <motion.button
        type="button"
        aria-label="Close modal"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-canvas/50 [backdrop-filter:blur(14px)_saturate(140%)] [-webkit-backdrop-filter:blur(14px)_saturate(140%)]",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      />
      <div className={cn("pointer-events-none absolute inset-0 flex justify-center px-4", placement === "bottom" ? "items-end pb-8" : "items-center")}>
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="panel"
              layout
              initial={{ opacity: 0, scale: enterScale, y: enterY }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: reduce ? 1 : 0.98, transition: { duration: 0.18, ease: EASE_OUT }, y: enterY }}
              transition={SPRING_PANEL}
              className={cn("pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-3xl bg-surface shadow-2xl will-change-transform", className)}
            >
              <motion.div layout="position" className="p-5">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={viewId}
                    initial={reduce ? { opacity: 0 } : { filter: "blur(4px)", opacity: 0, y: 8 }}
                    animate={reduce ? { opacity: 1, transition: { duration: 0.18, ease: EASE_OUT } } : { filter: "blur(0px)", opacity: 1, transition: { duration: 0.24, ease: EASE_OUT }, y: 0 }}
                    exit={reduce ? { opacity: 0, transition: { duration: 0.14, ease: EASE_OUT } } : { filter: "blur(4px)", opacity: 0, transition: { duration: 0.16, ease: EASE_OUT }, y: -8 }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>,
    document.body,
  );
}
