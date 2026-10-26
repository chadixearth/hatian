import {
  ArrowRight,
  ChevronDown,
  FileSpreadsheet,
  Plus,
  Receipt,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteExpense } from "@/app/actions/expenses";
import { deleteSettlement } from "@/app/actions/settlements";
import { AddExpenseForm } from "@/components/add-expense-form";
import { AddMemberForm } from "@/components/add-member-form";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { PersonalCard } from "@/components/group/personal-card";
import { RememberGroup } from "@/components/remember-group";
import { SettleUpCard } from "@/components/settle-up-card";
import { ShareButton } from "@/components/share-button";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { getGroupViewer } from "@/lib/account";
import { getGroupView } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import type { Expense, Settlement } from "@/lib/types";

type GroupPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: GroupPageProps): Promise<Metadata> {
  const { id } = await params;
  const group = await getGroupView(id);
  if (!group) {
    return { title: "Group not found" };
  }
  return {
    title: group.name,
    description: `Split expenses and settle up for ${group.name} on Hatian.`,
  };
}

export default function GroupPage({ params }: GroupPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:pb-12">
      <Suspense fallback={<GroupSkeleton />}>
        <GroupDashboard params={params} />
      </Suspense>
    </main>
  );
}

type ActivityItem =
  | { kind: "expense"; sortDate: string; createdAt: string; data: Expense }
  | {
      kind: "settlement";
      sortDate: string;
      createdAt: string;
      data: Settlement;
    };

function formatDayHeader(
  dateStr: string,
  todayISO: string,
  yesterdayISO: string,
): string {
  const dateOnly = dateStr.slice(0, 10);
  if (dateOnly === todayISO) return "Today";
  if (dateOnly === yesterdayISO) return "Yesterday";

  const parts = dateOnly.split("-").map(Number);
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(dt);
  }
  return dateOnly;
}

function describeSplit(expense: Expense): string {
  if (expense.splitMode === "equal") {
    const count = expense.shares.filter((s) => s.amountMinor > 0).length;
    return `split equally · ${count} ${count === 1 ? "person" : "people"}`;
  }
  if (expense.splitMode === "shares") {
    return "by shares";
  }
  return "exact amounts";
}

async function GroupDashboard({
  params,
}: {
  params: GroupPageProps["params"];
}) {
  const { id } = await params;
  const [group, viewer] = await Promise.all([
    getGroupView(id),
    getGroupViewer(id),
  ]);
  if (!group) {
    notFound();
  }

  const memberName = new Map(group.members.map((m) => [m.id, m.name]));
  const memberIndex = new Map(group.members.map((m, idx) => [m.id, idx]));
  const claimedSet = new Set(viewer.claimedMemberIds);

  const maxAbsNet = Math.max(
    1,
    ...group.balances.map((b) => Math.abs(b.netMinor)),
  );

  const activity: ActivityItem[] = [
    ...group.expenses.map((e) => ({
      kind: "expense" as const,
      sortDate: e.spentOn,
      createdAt: e.createdAt,
      data: e,
    })),
    ...group.settlements.map((s) => ({
      kind: "settlement" as const,
      sortDate: s.createdAt.slice(0, 10),
      createdAt: s.createdAt,
      data: s,
    })),
  ].sort((a, b) => {
    const byDate = b.sortDate.localeCompare(a.sortDate);
    if (byDate !== 0) return byDate;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const now = new Date();
  const todayUTC = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  const yesterdayUTC = new Date(todayUTC.getTime() - 86_400_000);
  const todayISO = todayUTC.toISOString().slice(0, 10);
  const yesterdayISO = yesterdayUTC.toISOString().slice(0, 10);

  const activityGroups: {
    dateKey: string;
    label: string;
    items: ActivityItem[];
  }[] = [];
  for (const item of activity) {
    const lastGroup = activityGroups[activityGroups.length - 1];
    if (lastGroup && lastGroup.dateKey === item.sortDate) {
      lastGroup.items.push(item);
    } else {
      activityGroups.push({
        dateKey: item.sortDate,
        label: formatDayHeader(item.sortDate, todayISO, yesterdayISO),
        items: [item],
      });
    }
  }

  const visibleAvatars = group.members.slice(0, 6);
  const overflowCount = Math.max(
    0,
    group.members.length - visibleAvatars.length,
  );

  return (
    <div className="space-y-6">
      <RememberGroup
        id={group.id}
        name={group.name}
        currency={group.currency}
        signedIn={viewer.user !== null}
      />

      <header className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {group.name}
              </h1>
              <span className="inline-flex items-center rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-muted">
                {group.currency}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center -space-x-1.5">
                {visibleAvatars.map((m, idx) => (
                  <MemberAvatar
                    key={m.id}
                    name={m.name}
                    index={idx}
                    size="sm"
                    className="ring-2 ring-surface"
                  />
                ))}
                {overflowCount > 0 && (
                  <span className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-surface-muted text-[11px] font-semibold text-muted ring-2 ring-surface">
                    +{overflowCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted">
                {group.members.length}{" "}
                {group.members.length === 1 ? "member" : "members"} ·{" "}
                {group.expenses.length}{" "}
                {group.expenses.length === 1 ? "expense" : "expenses"}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-medium text-muted">Total spent</p>
            <p className="mt-0.5 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
              {formatMoney(group.totalSpentMinor, group.currency)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-border pt-4">
          <ShareButton groupName={group.name} />
          <a
            href={`/g/${group.id}/export`}
            download
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <FileSpreadsheet
              className="size-4 text-accent"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Export to Excel</span>
          </a>
          <a
            href="#add-expense"
            data-open-add-expense="true"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
            <span>Add expense</span>
          </a>
        </div>
      </header>

      <PersonalCard
        groupId={group.id}
        currency={group.currency}
        members={group.members}
        balances={group.balances}
        transfers={group.transfers}
        viewer={viewer}
      />

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-6 lg:col-span-5 lg:order-2">
          <SettleUpCard
            groupId={group.id}
            currency={group.currency}
            members={group.members}
            transfers={group.transfers}
          />

          <section
            aria-labelledby="balances-heading"
            className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
          >
            <h2
              id="balances-heading"
              className="text-base font-semibold tracking-tight text-foreground"
            >
              Balances
            </h2>
            <ul className="mt-4 divide-y divide-border">
              {group.balances.map((b) => {
                const name = memberName.get(b.memberId) ?? "Unknown";
                const idx = memberIndex.get(b.memberId) ?? 0;
                const isViewer = viewer.memberId === b.memberId;
                const barPct =
                  b.netMinor === 0
                    ? 0
                    : Math.max(
                        6,
                        Math.round((Math.abs(b.netMinor) / maxAbsNet) * 100),
                      );
                return (
                  <li key={b.memberId} className="py-3.5 first:pt-1 last:pb-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <MemberAvatar name={name} index={idx} size="sm" />
                        <span className="truncate font-medium text-foreground">
                          {name}
                        </span>
                        {isViewer && (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                            You
                          </span>
                        )}
                      </div>

                      {b.netMinor > 0 ? (
                        <span className="shrink-0 rounded-full border border-get-border bg-get-bg px-2.5 py-0.5 text-xs font-semibold tabular-nums text-get">
                          gets back {formatMoney(b.netMinor, group.currency)}
                        </span>
                      ) : b.netMinor < 0 ? (
                        <span className="shrink-0 rounded-full border border-owe-border bg-owe-bg px-2.5 py-0.5 text-xs font-semibold tabular-nums text-owe">
                          owes{" "}
                          {formatMoney(Math.abs(b.netMinor), group.currency)}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-muted">
                          settled
                        </span>
                      )}
                    </div>

                    {barPct > 0 && (
                      <div
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
                      >
                        <div
                          style={{ width: `${barPct}%` }}
                          className={`h-full rounded-full ${
                            b.netMinor > 0 ? "bg-get" : "bg-owe"
                          }`}
                        />
                      </div>
                    )}

                    <p className="mt-1.5 text-xs tabular-nums text-muted">
                      Paid {formatMoney(b.paidMinor, group.currency)} · Share{" "}
                      {formatMoney(b.owedMinor, group.currency)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section
            aria-labelledby="members-heading"
            className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users
                  className="size-[18px] text-accent"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <h2
                  id="members-heading"
                  className="text-base font-semibold tracking-tight text-foreground"
                >
                  Members
                </h2>
              </div>
              <span className="text-xs text-muted">
                {group.members.length}{" "}
                {group.members.length === 1 ? "person" : "people"}
              </span>
            </div>

            <ul className="mt-3.5 flex flex-wrap gap-2">
              {group.members.map((m, idx) => {
                const isViewer = viewer.memberId === m.id;
                const isClaimed = claimedSet.has(m.id);
                return (
                  <li
                    key={m.id}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted py-1 pl-1.5 pr-3 text-xs font-medium text-foreground"
                  >
                    <MemberAvatar name={m.name} index={idx} size="xs" />
                    <span>{m.name}</span>
                    {isViewer && (
                      <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                        You
                      </span>
                    )}
                    {!isViewer && isClaimed && (
                      <span className="rounded-full border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted">
                        linked
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            <AddMemberForm groupId={group.id} />
          </section>
        </div>

        <div className="space-y-6 lg:col-span-7 lg:order-1">
          <AddExpenseForm
            groupId={group.id}
            currency={group.currency}
            members={group.members}
            defaultPaidBy={viewer.memberId}
          />

          <section
            aria-labelledby="activity-heading"
            className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
          >
            <div className="flex items-baseline justify-between">
              <h2
                id="activity-heading"
                className="text-base font-semibold tracking-tight text-foreground"
              >
                Activity
              </h2>
              <span className="text-xs text-muted">
                {activity.length} {activity.length === 1 ? "entry" : "entries"}
              </span>
            </div>

            {activityGroups.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                No expenses or payments recorded yet. Add the first expense to
                get started.
              </p>
            ) : (
              <div className="mt-4 space-y-5">
                {activityGroups.map((dayGroup) => (
                  <div key={dayGroup.dateKey} className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted">
                      {dayGroup.label}
                    </h3>

                    <ul className="divide-y divide-border rounded-xl border border-border bg-background">
                      {dayGroup.items.map((item) => {
                        if (item.kind === "settlement") {
                          const s = item.data;
                          const fromName = memberName.get(s.from) ?? "Unknown";
                          const toName = memberName.get(s.to) ?? "Unknown";
                          const fromIdx = memberIndex.get(s.from) ?? 0;
                          const toIdx = memberIndex.get(s.to) ?? 0;
                          const formatted = formatMoney(
                            s.amountMinor,
                            group.currency,
                          );
                          const deleteAction = deleteSettlement.bind(
                            null,
                            group.id,
                            s.id,
                          );

                          return (
                            <li
                              key={`settlement-${s.id}`}
                              className="flex items-center justify-between gap-3 px-3.5 py-3"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <span
                                  aria-hidden="true"
                                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-get-border bg-get-bg text-get"
                                >
                                  <ArrowRight
                                    className="size-4"
                                    strokeWidth={1.75}
                                  />
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
                                    <MemberAvatar
                                      name={fromName}
                                      index={fromIdx}
                                      size="xs"
                                    />
                                    <span className="font-semibold text-foreground">
                                      {fromName}
                                    </span>
                                    <span className="text-muted">paid</span>
                                    <MemberAvatar
                                      name={toName}
                                      index={toIdx}
                                      size="xs"
                                    />
                                    <span className="font-semibold text-foreground">
                                      {toName}
                                    </span>
                                    <span className="font-semibold tabular-nums text-get">
                                      {formatted}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <form action={deleteAction}>
                                <ConfirmSubmit
                                  label="Undo"
                                  pendingLabel="Undoing…"
                                  confirmMessage={`Undo payment of ${formatted} from ${fromName} to ${toName}?`}
                                  ariaLabel={`Undo payment of ${formatted} from ${fromName} to ${toName}`}
                                />
                              </form>
                            </li>
                          );
                        }

                        const expense = item.data;
                        const payerName =
                          memberName.get(expense.paidBy) ?? "Unknown";
                        const payerIdx = memberIndex.get(expense.paidBy) ?? 0;
                        const formattedTotal = formatMoney(
                          expense.amountMinor,
                          group.currency,
                        );
                        const deleteAction = deleteExpense.bind(
                          null,
                          group.id,
                          expense.id,
                        );

                        // Compute personal line when viewer is linked to a member
                        let personalLine: {
                          kind: "lent" | "owe";
                          text: string;
                        } | null = null;
                        if (viewer.memberId) {
                          const myShareMinor =
                            expense.shares.find(
                              (s) => s.memberId === viewer.memberId,
                            )?.amountMinor ?? 0;
                          if (expense.paidBy === viewer.memberId) {
                            const lentMinor = Math.max(
                              0,
                              expense.amountMinor - myShareMinor,
                            );
                            if (lentMinor > 0) {
                              personalLine = {
                                kind: "lent",
                                text: `you lent ${formatMoney(lentMinor, group.currency)}`,
                              };
                            }
                          } else if (myShareMinor > 0) {
                            personalLine = {
                              kind: "owe",
                              text: `you owe ${formatMoney(myShareMinor, group.currency)}`,
                            };
                          }
                        }

                        return (
                          <li
                            key={`expense-${expense.id}`}
                            className="px-3.5 py-3.5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 flex-1 items-start gap-3">
                                <span
                                  aria-hidden="true"
                                  className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-muted text-muted"
                                >
                                  <Receipt
                                    className="size-4"
                                    strokeWidth={1.75}
                                  />
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <h4 className="truncate text-sm font-semibold text-foreground">
                                      {expense.description}
                                    </h4>
                                    <span className="text-sm font-semibold tabular-nums text-foreground">
                                      {formattedTotal}
                                    </span>
                                  </div>

                                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                                    <MemberAvatar
                                      name={payerName}
                                      index={payerIdx}
                                      size="xs"
                                    />
                                    <span>
                                      <strong className="font-medium text-foreground">
                                        {payerName}
                                      </strong>{" "}
                                      paid
                                    </span>
                                    <span>·</span>
                                    <span>{describeSplit(expense)}</span>
                                  </div>

                                  {personalLine && (
                                    <p
                                      className={`mt-1 text-xs font-semibold tabular-nums ${
                                        personalLine.kind === "lent"
                                          ? "text-get"
                                          : "text-owe"
                                      }`}
                                    >
                                      {personalLine.text}
                                    </p>
                                  )}

                                  <details className="mt-2 group">
                                    <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg text-xs font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                                      <span>View split breakdown</span>
                                      <ChevronDown
                                        className="size-3.5 transition-transform group-open:rotate-180"
                                        strokeWidth={1.75}
                                        aria-hidden="true"
                                      />
                                    </summary>
                                    <ul className="mt-2 space-y-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs">
                                      {expense.shares.map((share) => {
                                        const participantName =
                                          memberName.get(share.memberId) ??
                                          "Unknown";
                                        const participantIdx =
                                          memberIndex.get(share.memberId) ?? 0;
                                        return (
                                          <li
                                            key={share.memberId}
                                            className="flex items-center justify-between gap-2"
                                          >
                                            <span className="flex items-center gap-2 text-foreground">
                                              <MemberAvatar
                                                name={participantName}
                                                index={participantIdx}
                                                size="xs"
                                              />
                                              <span>
                                                {participantName}
                                                {share.weight !== null && (
                                                  <span className="ml-1.5 text-muted">
                                                    ({share.weight}{" "}
                                                    {share.weight === 1
                                                      ? "share"
                                                      : "shares"}
                                                    )
                                                  </span>
                                                )}
                                              </span>
                                            </span>
                                            <span className="tabular-nums text-muted">
                                              {formatMoney(
                                                share.amountMinor,
                                                group.currency,
                                              )}
                                            </span>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </details>
                                </div>
                              </div>

                              <form action={deleteAction}>
                                <ConfirmSubmit
                                  confirmMessage={`Delete expense "${expense.description}" (${formattedTotal})?`}
                                  ariaLabel={`Delete expense ${expense.description}`}
                                />
                              </form>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function GroupSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <div className="h-36 animate-pulse rounded-2xl border border-border bg-surface p-6 shadow-card" />
      <div className="h-20 animate-pulse rounded-2xl border border-border bg-surface p-5 shadow-card" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-surface shadow-card lg:col-span-7" />
        <div className="h-80 animate-pulse rounded-2xl border border-border bg-surface shadow-card lg:col-span-5" />
      </div>
    </div>
  );
}
