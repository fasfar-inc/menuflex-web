"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "./ui";

/** A submit button that shows the form is working and can't be pressed twice. */
export function SubmitButton({ children, className = buttonClass, pendingLabel = "Saving…" }: { children: React.ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}
