"use client";

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
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className="h-4 w-4 text-accent"
        >
          <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.475l6.733-3.366A2.52 2.52 0 0 1 13 4.5Z" />
        </svg>
        <span>{copied ? "Link copied" : "Share link"}</span>
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Group link copied to clipboard" : ""}
      </span>
    </div>
  );
}
