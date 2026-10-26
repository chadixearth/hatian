"use client";

import { useFormStatus } from "react-dom";

export function ConfirmSubmit({
  confirmMessage,
  label = "Delete",
  pendingLabel = "Deleting…",
  ariaLabel,
}: {
  confirmMessage: string;
  label?: string;
  pendingLabel?: string;
  ariaLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      className="inline-flex min-h-11 items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-danger-bg hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
