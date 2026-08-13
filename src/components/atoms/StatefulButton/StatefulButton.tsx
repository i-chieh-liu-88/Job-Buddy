"use client";
// beui.dev/components/motion/button

import { Check, Loader2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { forwardRef, type ReactNode } from "react";
import { EASE_OUT, SPRING_SWAP } from "../../../lib/ease";
import { Button, type ButtonProps } from "./base";

export type ButtonState = "idle" | "loading" | "success" | "error";

export interface StatefulButtonProps extends Omit<ButtonProps, "children"> {
  state?: ButtonState;
  children: ReactNode;
  loadingText?: ReactNode;
  successText?: ReactNode;
  errorText?: ReactNode;
  icon?: ReactNode;
}

const blur = "blur(6px)";

function StateIcon({ state, icon }: { state: ButtonState; icon?: ReactNode }) {
  const reduce = useReducedMotion();
  const content =
    state === "loading" ? <Loader2 className="size-4 animate-spin" /> :
    state === "success" ? <Check className="size-4" /> :
    state === "error" ? <X className="size-4" /> : icon;

  if (!content) return null;
  return (
    <motion.span
      key={`${state}-icon`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, width: 0, scale: 0.7, filter: blur }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, width: "1rem", scale: 1, filter: "blur(0px)" }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, width: 0, scale: 0.7, filter: blur }}
      transition={reduce ? { duration: 0.15 } : SPRING_SWAP}
      className="inline-grid shrink-0 place-items-center overflow-hidden"
    >
      {content}
    </motion.span>
  );
}

export const StatefulButton = forwardRef<HTMLButtonElement, StatefulButtonProps>(
  function StatefulButton(
    {
      state = "idle",
      children,
      loadingText = "Loading",
      successText = "Done",
      errorText = "Try again",
      icon,
      disabled,
      ...rest
    },
    ref,
  ) {
    const reduce = useReducedMotion();
    const isBusy = state === "loading";
    const label =
      state === "loading" ? loadingText :
      state === "success" ? successText :
      state === "error" ? errorText : children;

    return (
      <Button
        ref={ref}
        aria-busy={isBusy}
        disabled={disabled || isBusy}
        whileHover={undefined}
        {...rest}
      >
        <span aria-live="polite" className="inline-flex items-center justify-center gap-2 overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout">
            <StateIcon state={state} icon={icon} />
          </AnimatePresence>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={`${state}-${typeof label === "string" ? label : "label"}`}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, filter: blur }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14, filter: blur }}
              transition={reduce ? { duration: 0.15 } : { ...SPRING_SWAP, ease: EASE_OUT }}
              className="whitespace-nowrap"
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </span>
      </Button>
    );
  },
);
