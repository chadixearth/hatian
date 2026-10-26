"use client";

import { Check, Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { addMember } from "@/app/actions/groups";
import { IDLE } from "@/lib/types";

export function AddMemberForm({ groupId }: { groupId: string }) {
  const boundAddMember = addMember.bind(null, groupId);
  const [state, formAction, pending] = useActionState(boundAddMember, IDLE);
  const [name, setName] = useState("");
  const [lastResetAt, setLastResetAt] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.status === "ok" && state.at !== lastResetAt) {
      setLastResetAt(state.at);
      setName("");
      setShowSuccess(true);
      const timer = window.setTimeout(() => setShowSuccess(false), 3000);
      return () => window.clearTimeout(timer);
    }
  }, [state, lastResetAt]);

  return (
    <form action={formAction} className="mt-4 space-y-2">
      <div className="flex items-center gap-2">
        <label htmlFor="new-member-name" className="sr-only">
          New member name
        </label>
        <input
          id="new-member-name"
          name="name"
          type="text"
          required
          maxLength={30}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add another person…"
          className="block min-h-11 flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
        >
          <Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />
          <span>{pending ? "Adding…" : "Add person"}</span>
        </button>
      </div>

      <div aria-live="polite" className="min-h-1">
        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger-bg px-3 py-2 text-xs font-medium text-danger"
          >
            {state.message}
          </p>
        )}
        {showSuccess && state.status === "ok" && (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-get">
            <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
            <span>Person added</span>
          </p>
        )}
      </div>
    </form>
  );
}
