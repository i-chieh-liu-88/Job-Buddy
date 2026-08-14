/* eslint-disable react-hooks/immutability, react-hooks/refs */

import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import {
  cloneElement,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../lib/cn";
import { usePopoverPortalPosition } from "./usePopoverPortalPosition";

type Side = "top" | "bottom";
type Align = "start" | "center" | "end";
type TriggerMode = "click" | "hover";

const OPEN_SPRING = { type: "spring", visualDuration: 0.3, bounce: 0.15 } as const;
const CLOSE_SPRING = { type: "spring", visualDuration: 0.21, bounce: 0.15 } as const;
const HOVER_CLOSE_DELAY = 120;

type PopoverContextValue = {
  align: Align;
  contentId: string;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
  gap: number;
  gooId: string;
  gooStrength: number;
  open: boolean;
  openHover: () => void;
  panelRadius: number;
  progress: MotionValue<number>;
  reduce: boolean;
  scheduleClose: () => void;
  side: Side;
  toggle: () => void;
  triggerMode: TriggerMode;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(component: string) {
  const context = useContext(PopoverContext);
  if (!context) throw new Error(`${component} must be used within <Popover>`);
  return context;
}

export type PopoverProps = {
  align?: Align;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  gooStrength?: number;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  panelRadius?: number;
  side?: Side;
  sideOffset?: number;
  trigger?: TriggerMode;
};

export function Popover({
  align = "center",
  children,
  className,
  defaultOpen = false,
  gooStrength = 8,
  onOpenChange,
  open: controlledOpen,
  panelRadius = 16,
  side = "bottom",
  sideOffset = 14,
  trigger = "click",
}: PopoverProps) {
  const reduce = useReducedMotion() ?? false;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentId = useId();
  const gooId = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const progress = useMotionValue(defaultOpen ? 1 : 0);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : internalOpen;

  const setOpen = useCallback((next: boolean) => {
    if (!controlled) setInternalOpen(next);
    onOpenChange?.(next);
  }, [controlled, onOpenChange]);
  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);
  const openHover = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose, setOpen]);
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY);
  }, [cancelClose, setOpen]);
  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);

  useEffect(() => () => cancelClose(), [cancelClose]);
  useEffect(() => {
    const controls = animate(progress, open ? 1 : 0, reduce ? { duration: 0 } : open ? OPEN_SPRING : CLOSE_SPRING);
    return () => controls.stop();
  }, [open, progress, reduce]);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !contentRef.current?.contains(target)) setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [open, setOpen]);

  const value = useMemo<PopoverContextValue>(() => ({
    align, contentId, contentRef, gap: sideOffset, gooId, gooStrength, open,
    openHover, panelRadius, progress, reduce, scheduleClose, side, toggle,
    triggerMode: trigger, triggerRef,
  }), [align, contentId, gooId, gooStrength, open, openHover, panelRadius, progress, reduce, scheduleClose, side, sideOffset, toggle, trigger]);

  return (
    <PopoverContext.Provider value={value}>
      <div
        ref={rootRef}
        className={cn("relative inline-flex isolate", className)}
        onMouseEnter={trigger === "hover" ? openHover : undefined}
        onMouseLeave={trigger === "hover" ? scheduleClose : undefined}
      >
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    });
  };
}

export function PopoverTrigger({ children }: { children: ReactElement }) {
  const context = usePopoverContext("PopoverTrigger");
  if (!isValidElement(children)) return children;
  const child = children as ReactElement<Record<string, unknown>>;
  const childProps = child.props;
  const compose = (name: string, action: () => void) => (event: { defaultPrevented?: boolean }) => {
    (childProps[name] as ((value: unknown) => void) | undefined)?.(event);
    if (!event.defaultPrevented) action();
  };
  const hoverHandlers = context.triggerMode === "hover" ? {
    onBlur: compose("onBlur", context.scheduleClose),
    onClick: compose("onClick", context.openHover),
    onFocus: compose("onFocus", context.openHover),
  } : { onClick: compose("onClick", context.toggle) };

  return cloneElement(child, {
    ...hoverHandlers,
    ref: mergeRefs((childProps as { ref?: Ref<HTMLElement> }).ref, (node: HTMLElement | null) => {
      context.triggerRef.current = node;
    }),
    className: cn("relative z-0", childProps.className as string | undefined),
    "aria-controls": context.open ? context.contentId : undefined,
    "aria-expanded": context.open,
    "aria-haspopup": "dialog",
    "data-state": context.open ? "open" : "closed",
  });
}

type PanelSize = { height: number; width: number };

function getPanelPosition(trigger: DOMRect, content: PanelSize, side: Side, align: Align, gap: number) {
  const top = side === "bottom" ? trigger.height + gap : -(content.height + gap);
  const left = align === "start" ? 0 : align === "end" ? trigger.width - content.width : (trigger.width - content.width) / 2;
  return { left, top };
}

export function PopoverContent({ children, className }: { children: ReactNode; className?: string }) {
  const context = usePopoverContext("PopoverContent");
  const [portalReady, setPortalReady] = useState(false);
  const panelRef = context.contentRef;
  const clipRef = useRef<HTMLDivElement>(null);
  const layout = usePopoverPortalPosition(context.triggerRef, panelRef, portalReady && context.open);
  const position = layout ? getPanelPosition(layout.trigger, layout.content, context.side, context.align, context.gap) : { left: 0, top: 0 };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPortalReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useLayoutEffect(() => {
    const updateClip = (progress: number) => {
      if (!clipRef.current || !layout) return;
      const width = layout.trigger.width + (layout.content.width - layout.trigger.width) * progress;
      const height = layout.trigger.height + (layout.content.height - layout.trigger.height) * progress;
      const radius = Math.min(layout.trigger.height / 2, context.panelRadius) + (context.panelRadius - Math.min(layout.trigger.height / 2, context.panelRadius)) * progress;
      clipRef.current.style.clipPath = `inset(0 calc(100% - ${width}px) calc(100% - ${height}px) 0 round ${radius}px)`;
    };
    updateClip(context.progress.get());
    return context.progress.on("change", updateClip);
  }, [context.panelRadius, context.progress, layout]);
  useMotionValueEvent(context.progress, "change", () => undefined);

  if (!portalReady) return null;
  return createPortal(
    <div
      data-popover-portal=""
      className="pointer-events-none fixed left-0 top-0 z-[9999] isolate size-0"
      style={{
        transform: `translate3d(${layout?.trigger.left ?? 0}px, ${layout?.trigger.top ?? 0}px, 0)`,
        visibility: layout ? "visible" : "hidden",
      }}
    >
      <svg aria-hidden className="absolute size-0">
        <defs>
          <filter id={context.gooId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={context.gooStrength} result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -10" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div className="pointer-events-none absolute z-[-1]" style={{ filter: context.reduce ? undefined : `url(#${context.gooId})`, height: Math.max(layout?.trigger.height ?? 0, layout?.content.height ?? 0), width: Math.max(layout?.trigger.width ?? 0, layout?.content.width ?? 0) }}>
        <div className="absolute inset-0 rounded-2xl bg-surface" />
      </div>
      <div className="pointer-events-none absolute" style={{ left: position.left, top: position.top }}>
        <div ref={clipRef} className="pointer-events-none" style={{ pointerEvents: context.open ? "auto" : "none" }}>
          <div
            ref={panelRef}
            id={context.contentId}
            role="dialog"
            aria-hidden={!context.open}
            inert={!context.open}
            className={cn("w-max max-w-[min(92vw,20rem)] rounded-2xl border border-line bg-surface p-4 text-ink shadow-xl outline-none", className)}
            onMouseEnter={context.triggerMode === "hover" ? context.openHover : undefined}
            onMouseLeave={context.triggerMode === "hover" ? context.scheduleClose : undefined}
          >
            {context.open ? children : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
