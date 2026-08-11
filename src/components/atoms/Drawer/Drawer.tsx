import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  RefObject,
} from "react";
import { cn } from "../../../lib/cn";
import {
  DRAWER_SPRING,
  REDUCED_MOTION_TRANSITION,
} from "../../../lib/motion";

// Adapted from https://beui.dev/components/motion/drawer

export type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  children: ReactNode;
  className?: string;
  backdropClassName?: string;
  ariaLabel?: string;
  dismissable?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onExitComplete?: () => void;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const panelVariants = {
  left: { closed: { x: "-100%" }, open: { x: 0 } },
  right: { closed: { x: "100%" }, open: { x: 0 } },
};

export function Drawer({
  open,
  onOpenChange,
  side = "right",
  children,
  className,
  backdropClassName,
  ariaLabel,
  dismissable = true,
  initialFocusRef,
  onExitComplete,
}: DrawerProps) {
  const panelRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const animationFrameId = window.requestAnimationFrame(() => {
      const initialFocusTarget =
        initialFocusRef?.current ??
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
        panelRef.current;
      initialFocusTarget?.focus();
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      document.body.style.overflow = previousOverflow;
    };
  }, [initialFocusRef, open]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape" || !dismissable) return;

      event.preventDefault();
      onOpenChange(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [dismissable, onOpenChange, open]);

  function handlePanelKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;

    const focusableElements = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
    ).filter(
      (element) =>
        element.getAttribute("aria-hidden") !== "true" &&
        element.getAttribute("hidden") === null,
    );

    if (focusableElements.length === 0) {
      event.preventDefault();
      panelRef.current?.focus();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {open ? (
        <>
          <motion.div
            data-testid="drawer-backdrop"
            aria-hidden="true"
            className={cn(
              "fixed inset-0 z-40 bg-ink/30 backdrop-blur-[1px]",
              backdropClassName,
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={
              prefersReducedMotion
                ? REDUCED_MOTION_TRANSITION
                : { duration: 0.18 }
            }
            onClick={() => {
              if (dismissable) onOpenChange(false);
            }}
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            tabIndex={-1}
            data-reduced-motion={prefersReducedMotion ? "true" : undefined}
            className={cn(
              "fixed inset-y-0 z-50 flex flex-col bg-canvas text-ink shadow-[0_24px_64px_rgba(30,31,33,0.18)]",
              side === "left"
                ? "left-0 border-r border-line"
                : "right-0 border-l border-line",
              className,
            )}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : panelVariants[side].closed
            }
            animate={
              prefersReducedMotion ? { opacity: 1 } : panelVariants[side].open
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : panelVariants[side].closed
            }
            transition={
              prefersReducedMotion
                ? REDUCED_MOTION_TRANSITION
                : DRAWER_SPRING
            }
            onKeyDown={handlePanelKeyDown}
          >
            {children}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
