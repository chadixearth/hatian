"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type RecentGroup,
  readRecentGroups,
  removeRecentGroup,
} from "@/components/recent-groups-storage";

export function RecentGroups() {
  const [groups, setGroups] = useState<RecentGroup[]>([]);

  useEffect(() => {
    setGroups(readRecentGroups());
  }, []);

  if (groups.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="your-groups-heading" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2
          id="your-groups-heading"
          className="text-base font-semibold tracking-tight text-foreground"
        >
          Your groups
        </h2>
        <span className="text-xs text-muted">Saved on this device</span>
      </div>
      <ul className="divide-y divide-border rounded-[14px] border border-border bg-surface shadow-2xs">
        {groups.map((group) => (
          <li
            key={group.id}
            className="flex items-center justify-between gap-2"
          >
            <Link
              href={`/g/${group.id}`}
              className="flex min-h-12 flex-1 items-center justify-between gap-3 rounded-l-[14px] px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="truncate">{group.name}</span>
              <span className="inline-flex shrink-0 items-center rounded-md border border-border bg-surface-muted px-2 py-0.5 font-mono text-xs font-medium text-muted">
                {group.currency}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setGroups(removeRecentGroup(group.id))}
              aria-label={`Remove ${group.name} from recent groups`}
              className="mr-1.5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              title="Forget from this device"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="h-4 w-4"
              >
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
