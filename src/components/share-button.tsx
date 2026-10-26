"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({ groupName }: { groupName: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: `${groupName} · Hatian`,
          text: `Split expenses for ${groupName} on Hatian`,
          url,
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard permission denied
    }
  }

  return (
    <div className="inline-flex items-center">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {copied ? (
          <Check
            className="size-4 text-get"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        ) : (
          <Share2
            className="size-4 text-accent"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        )}
        <span>{copied ? "Link copied" : "Share link"}</span>
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Group link copied to clipboard" : ""}
      </span>
    </div>
  );
}
