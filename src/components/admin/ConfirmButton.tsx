"use client";

import { useFormStatus } from "react-dom";

/** A submit button that asks first, for anything that can't be undone. */
export function ConfirmButton({ message, className, children }: { message: string; className: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
