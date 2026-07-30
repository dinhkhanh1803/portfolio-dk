"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

type NeonFleetDialogProps = {
  children: ReactNode;
  className: string;
  labelledBy: string;
  onEscape?: () => void;
  open: boolean;
  returnFocusRef: RefObject<HTMLElement | null>;
};

export function NeonFleetDialog({
  className,
  children,
  labelledBy,
  onEscape,
  open,
  returnFocusRef,
}: NeonFleetDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    const returnFocusTarget = returnFocusRef.current;
    if (!dialog.open) dialog.showModal();
    const frame = window.requestAnimationFrame(() => {
      dialog.querySelector<HTMLElement>(
        "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
      )?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (dialog.open) dialog.close();
      returnFocusTarget?.focus();
    };
  }, [open, returnFocusRef]);

  return (
    <dialog
      ref={dialogRef}
      className={className}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onEscape?.();
      }}
    >
      {children}
    </dialog>
  );
}
