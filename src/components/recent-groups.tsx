"use client";

import { ArrowRight, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type RecentGroup,
  readRecentGroups,
  removeRecentGroup,
} from "@/components/recent-groups-storage";
import { authClient } from "@/lib/auth/client";

export function RecentGroups() {
  const [groups, setGroups] = useState<RecentGroup[]>([]);
  const { data: session } = authClient.useSession();
  const signedIn = Boolean(session?.user);

  useEffect(() => {
    setGroups(readRecentGroups());
  }, []);

  if (groups.length === 0 && !signedIn) {
    return null;
  }

  return (
    <section aria-labelledby="your-groups-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users
            className="size-4 text-accent"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <h2
            id="your-groups-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            Your groups
          </h2>
          <span className="text-xs text-muted">Saved on this device</span>
        </div>

        {signedIn && groups.length > 0 && (
          <Link
            href="/groups"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold text-accent transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span>See everything in My groups</span>
            <ArrowRight
              className="size-3.5"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Link>
        )}
      </div>

      {groups.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          {groups.map((group) => (
            <li
              key={group.id}
              className="flex items-center justify-between gap-2 pr-2"
            >
              <Link
                href={`/g/${group.id}`}
                className="flex min-h-12 flex-1 items-center justify-between gap-3 rounded-l-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span className="truncate">{group.name}</span>
                <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-muted">
                  {group.currency}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setGroups(removeRecentGroup(group.id))}
                aria-label={`Remove ${group.name} from recent groups`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted transition-colors hover:bg-danger-bg hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                title="Forget from this device"
              >
                <Trash2
                  className="size-4"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
          <p className="text-sm text-muted">
            No recent groups on this browser yet. Open your account groups to
            pick up where you left off.
          </p>
          <Link
            href="/groups"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span>See everything in My groups</span>
            <ArrowRight
              className="size-4 text-accent"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Link>
        </div>
      )}
    </section>
  );
}
