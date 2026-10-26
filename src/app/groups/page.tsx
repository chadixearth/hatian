import {
  ArrowRight,
  Check,
  FileSpreadsheet,
  HandCoins,
  Plus,
  Receipt,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { forgetGroup } from "@/app/actions/account";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { getMyGroups } from "@/lib/account";
import { formatMoney } from "@/lib/money";
import type { MyGroup } from "@/lib/types";

export const metadata: Metadata = {
  title: "My groups",
};

function formatActivityDate(iso: string | null): string {
  if (!iso) return "No activity yet";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "Recent activity";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function GroupBalancePill({ group }: { group: MyGroup }) {
  if (group.myMemberId === null || group.myNetMinor === null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-muted">
        <Users
          className="size-3.5 text-accent"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <span>Link yourself in this group</span>
      </span>
    );
  }

  const memberPrefix = group.myMemberName ? `${group.myMemberName} · ` : "";

  if (group.myNetMinor > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-get-border bg-get-bg px-3 py-1 text-xs font-semibold text-get tabular-nums">
        {group.myMemberName ? (
          <MemberAvatar name={group.myMemberName} index={0} size="xs" />
        ) : null}
        <span>
          {memberPrefix}You’re owed{" "}
          {formatMoney(group.myNetMinor, group.currency)}
        </span>
      </span>
    );
  }

  if (group.myNetMinor < 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-owe-border bg-owe-bg px-3 py-1 text-xs font-semibold text-owe tabular-nums">
        {group.myMemberName ? (
          <MemberAvatar name={group.myMemberName} index={1} size="xs" />
        ) : null}
        <span>
          {memberPrefix}You owe{" "}
          {formatMoney(Math.abs(group.myNetMinor), group.currency)}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-muted tabular-nums">
      <Check
        className="size-3.5 text-accent"
        strokeWidth={2}
        aria-hidden="true"
      />
      <span>
        {memberPrefix}Settled ({formatMoney(0, group.currency)})
      </span>
    </span>
  );
}

export function MyGroupsSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-muted motion-reduce:animate-none" />
          <div className="h-4 w-72 animate-pulse rounded bg-surface-muted/70 motion-reduce:animate-none" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-11 w-44 animate-pulse rounded-xl bg-surface-muted motion-reduce:animate-none" />
          <div className="h-11 w-36 animate-pulse rounded-xl bg-surface-muted motion-reduce:animate-none" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-2xl border border-border bg-surface p-5 shadow-card motion-reduce:animate-none" />
        <div className="h-28 animate-pulse rounded-2xl border border-border bg-surface p-5 shadow-card motion-reduce:animate-none" />
      </div>

      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-2xl border border-border bg-surface p-5 shadow-card motion-reduce:animate-none" />
        <div className="h-28 animate-pulse rounded-2xl border border-border bg-surface p-5 shadow-card motion-reduce:animate-none" />
        <div className="h-28 animate-pulse rounded-2xl border border-border bg-surface p-5 shadow-card motion-reduce:animate-none" />
      </div>
    </div>
  );
}

async function MyGroupsContent() {
  const data = await getMyGroups();
  if (!data) {
    redirect("/sign-in?next=/groups");
  }

  const firstName =
    data.user.name?.trim().split(/\s+/)[0] ||
    data.user.email.split("@")[0] ||
    "there";

  return (
    <div className="space-y-8">
      {/* Greeting & Actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Hi, {firstName}
          </h1>
          <p className="text-sm text-muted">
            Your saved groups and linked balances across devices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/groups/export"
            download
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <FileSpreadsheet
              className="size-4 text-accent"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Export all to Excel</span>
          </a>

          <Link
            href="/#create-group"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />
            <span>New group</span>
          </Link>
        </div>
      </div>

      {/* Per-currency Totals */}
      <section aria-labelledby="totals-heading" className="space-y-3">
        <h2
          id="totals-heading"
          className="text-base font-semibold tracking-tight text-foreground"
        >
          Overall balances
        </h2>

        {data.totals.length > 0 ? (
          <div className="space-y-3">
            {data.totals.map((total) => (
              <div key={total.currency} className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-get-border bg-get-bg p-5 shadow-card">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-get">
                      You’re owed
                    </span>
                    <span className="rounded-full border border-get-border bg-surface/80 px-2.5 py-0.5 text-xs font-semibold text-get">
                      {total.currency}
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-get tabular-nums">
                    {formatMoney(total.owedToMeMinor, total.currency)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Across linked {total.currency} groups where others owe you
                  </p>
                </div>

                <div className="rounded-2xl border border-owe-border bg-owe-bg p-5 shadow-card">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-owe">
                      You owe
                    </span>
                    <span className="rounded-full border border-owe-border bg-surface/80 px-2.5 py-0.5 text-xs font-semibold text-owe">
                      {total.currency}
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-owe tabular-nums">
                    {formatMoney(total.iOweMinor, total.currency)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Across linked {total.currency} groups where you owe others
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-get-border bg-get-bg p-5 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-get">
                  You’re owed
                </span>
                <HandCoins
                  className="size-4 text-get"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-get tabular-nums">
                {formatMoney(0, "PHP")}
              </p>
              <p className="mt-1 text-xs text-muted">
                Link yourself as a member inside a group to track what you’re
                owed
              </p>
            </div>

            <div className="rounded-2xl border border-owe-border bg-owe-bg p-5 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-owe">You owe</span>
                <Receipt
                  className="size-4 text-owe"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-owe tabular-nums">
                {formatMoney(0, "PHP")}
              </p>
              <p className="mt-1 text-xs text-muted">
                Link yourself as a member inside a group to track what you owe
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Group List or Empty State */}
      <section aria-labelledby="saved-groups-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="saved-groups-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            Saved groups
          </h2>
          <span className="text-xs text-muted tabular-nums">
            {data.groups.length} {data.groups.length === 1 ? "group" : "groups"}
          </span>
        </div>

        {data.groups.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card sm:p-10">
            <div className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl bg-surface-muted text-accent">
              <Users className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">
              No saved groups yet
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
              Start a new group or open any shared Hatian link while signed
              in—it will automatically save to your account.
            </p>
            <div className="mt-6">
              <Link
                href="/#create-group"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Plus
                  className="size-4"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>Create a group</span>
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {data.groups.map((group) => (
              <li
                key={group.id}
                className="rounded-2xl border border-border bg-surface p-5 shadow-card transition-colors hover:border-accent/40"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <Link
                    href={`/g/${group.id}`}
                    className="group min-w-0 flex-1 space-y-2 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-accent">
                        {group.name}
                      </span>
                      <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-muted">
                        {group.currency}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Users
                          className="size-3.5 text-muted"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        {group.memberCount}{" "}
                        {group.memberCount === 1 ? "member" : "members"}
                      </span>
                      <span className="tabular-nums">
                        Total spent:{" "}
                        <strong className="font-medium text-foreground">
                          {formatMoney(group.totalSpentMinor, group.currency)}
                        </strong>
                      </span>
                      <span>
                        Last activity:{" "}
                        {formatActivityDate(group.lastActivityAt)}
                      </span>
                    </div>
                  </Link>

                  <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-col sm:items-end">
                    <Link
                      href={`/g/${group.id}`}
                      className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <GroupBalancePill group={group} />
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/g/${group.id}`}
                        className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        <span>Open</span>
                        <ArrowRight
                          className="size-3.5"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                      </Link>

                      <form action={forgetGroup.bind(null, group.id)}>
                        <ConfirmSubmit
                          confirmMessage={`Remove "${group.name}" from your saved groups? The group itself and its expenses will not be deleted.`}
                          label="Remove from my groups"
                          pendingLabel="Removing…"
                          ariaLabel={`Remove ${group.name} from my groups`}
                        />
                      </form>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function MyGroupsPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <Suspense fallback={<MyGroupsSkeleton />}>
        <MyGroupsContent />
      </Suspense>
    </main>
  );
}
