import { useLayoutEffect, useState, type MutableRefObject } from "react";

type PortalLayout = {
  content: { height: number; width: number };
  trigger: DOMRect;
};

export function usePopoverPortalPosition(
  triggerRef: MutableRefObject<HTMLElement | null>,
  contentRef: MutableRefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  const [layout, setLayout] = useState<PortalLayout | null>(null);

  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    const updateLayout = () => {
      const trigger = triggerRef.current;
      const content = contentRef.current;
      if (!trigger || !content) return;

      const contentRect = content.getBoundingClientRect();
      setLayout({
        trigger: trigger.getBoundingClientRect(),
        content: { height: contentRect.height, width: contentRect.width },
      });
    };

    updateLayout();
    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updateLayout);
    if (observer) {
      if (triggerRef.current) observer.observe(triggerRef.current);
      if (contentRef.current) observer.observe(contentRef.current);
    }
    window.addEventListener("resize", updateLayout);
    window.addEventListener("scroll", updateLayout, true);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("scroll", updateLayout, true);
    };
  }, [contentRef, enabled, triggerRef]);

  return layout;
}
