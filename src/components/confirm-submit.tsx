"use client";

import { Trash2 } from "lucide-react";
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
  const isDelete = label.toLowerCase() === "delete";

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
      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-danger-bg hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-50"
    >
      {isDelete && !pending && (
        <Trash2
          className="size-3.5 shrink-0"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      )}
      <span>{pending ? pendingLabel : label}</span>
    </button>
  );
}
