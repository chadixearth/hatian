import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteExpense } from "@/app/actions/expenses";
import { deleteSettlement } from "@/app/actions/settlements";
import { AddExpenseForm } from "@/components/add-expense-form";
import { AddMemberForm } from "@/components/add-member-form";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { HatianLogo } from "@/components/logo";
import { RememberGroup } from "@/components/remember-group";
import { SettleUpCard } from "@/components/settle-up-card";
import { ShareButton } from "@/components/share-button";
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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10 lg:max-w-5xl">
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

function formatShortDate(dateStr: string): string {
  const dateOnly = dateStr.slice(0, 10);
  const parts = dateOnly.split("-").map(Number);
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
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
  const group = await getGroupView(id);
  if (!group) {
    notFound();
  }

  const memberName = new Map(group.members.map((m) => [m.id, m.name]));
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

  return (
    <div className="space-y-6">
      <RememberGroup
        id={group.id}
        name={group.name}
        currency={group.currency}
      />

      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-2 text-sm font-semibold text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <HatianLogo className="h-7 w-7 shrink-0" />
          <span>Hatian</span>
        </Link>
        <ShareButton groupName={group.name} />
      </div>

      <header className="rounded-[14px] border border-border bg-surface p-5 shadow-2xs sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {group.name}
              </h1>
              <span className="inline-flex items-center rounded-md border border-border bg-surface-muted px-2 py-0.5 font-mono text-xs font-medium text-muted">
                {group.currency}
              </span>
            </div>
            <p className="text-xs text-muted">
              {group.members.length}{" "}
              {group.members.length === 1 ? "member" : "members"} ·{" "}
              {group.expenses.length}{" "}
              {group.expenses.length === 1 ? "expense" : "expenses"}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-medium text-muted">Total group spend</p>
            <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
              {formatMoney(group.totalSpentMinor, group.currency)}
            </p>
          </div>
        </div>
        <a
          href="#add-expense"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden"
        >
          + Add expense
        </a>
      </header>

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
            className="rounded-[14px] border border-border bg-surface p-5 shadow-2xs"
          >
            <h2
              id="balances-heading"
              className="text-base font-semibold tracking-tight text-foreground"
            >
              Balances
            </h2>
            <ul className="mt-3.5 divide-y divide-border">
              {group.balances.map((b) => {
                const name = memberName.get(b.memberId) ?? "Unknown";
                const barPct =
                  b.netMinor === 0
                    ? 0
                    : Math.max(
                        6,
                        Math.round((Math.abs(b.netMinor) / maxAbsNet) * 100),
                      );
                return (
                  <li key={b.memberId} className="py-3 first:pt-1 last:pb-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-foreground">
                        {name}
                      </span>
                      {b.netMinor > 0 ? (
                        <span className="font-mono text-xs font-semibold tabular-nums text-get">
                          gets back {formatMoney(b.netMinor, group.currency)}
                        </span>
                      ) : b.netMinor < 0 ? (
                        <span className="font-mono text-xs font-semibold tabular-nums text-owe">
                          owes{" "}
                          {formatMoney(Math.abs(b.netMinor), group.currency)}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-muted">
                          settled
                        </span>
                      )}
                    </div>

                    {barPct > 0 && (
                      <div
                        aria-hidden="true"
                        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
                      >
                        <div
                          style={{ width: `${barPct}%` }}
                          className={`h-full rounded-full ${
                            b.netMinor > 0 ? "bg-get" : "bg-owe"
                          }`}
                        />
                      </div>
                    )}

                    <p className="mt-1 font-mono text-[11px] tabular-nums text-muted">
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
            className="rounded-[14px] border border-border bg-surface p-5 shadow-2xs"
          >
            <div className="flex items-baseline justify-between">
              <h2
                id="members-heading"
                className="text-base font-semibold tracking-tight text-foreground"
              >
                Members
              </h2>
              <span className="text-xs text-muted">
                {group.members.length} people
              </span>
            </div>

            <ul className="mt-3 flex flex-wrap gap-1.5">
              {group.members.map((m) => (
                <li
                  key={m.id}
                  className="inline-flex items-center rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-foreground"
                >
                  {m.name}
                </li>
              ))}
            </ul>

            <AddMemberForm groupId={group.id} />
          </section>
        </div>

        <div className="space-y-6 lg:col-span-7 lg:order-1">
          <AddExpenseForm
            groupId={group.id}
            currency={group.currency}
            members={group.members}
          />

          <section
            aria-labelledby="activity-heading"
            className="rounded-[14px] border border-border bg-surface p-5 shadow-2xs"
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

            {activity.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                No expenses or payments recorded yet. Add the first expense
                above.
              </p>
            ) : (
              <ul className="mt-3.5 divide-y divide-border">
                {activity.map((item) => {
                  if (item.kind === "settlement") {
                    const s = item.data;
                    const fromName = memberName.get(s.from) ?? "Unknown";
                    const toName = memberName.get(s.to) ?? "Unknown";
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
                        className="flex items-center justify-between gap-3 py-3.5 first:pt-1 last:pb-1"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                            <span className="inline-flex items-center rounded-md border border-get-border bg-get-bg px-1.5 py-0.5 text-[11px] font-semibold text-get">
                              Payment
                            </span>
                            <p className="text-foreground">
                              <span className="font-semibold">{fromName}</span>{" "}
                              paid{" "}
                              <span className="font-semibold">{toName}</span>{" "}
                              <span className="font-mono font-semibold tabular-nums text-get">
                                {formatted}
                              </span>
                            </p>
                          </div>
                          <p className="mt-0.5 text-xs text-muted">
                            {formatShortDate(s.createdAt)}
                          </p>
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
                  const payerName = memberName.get(expense.paidBy) ?? "Unknown";
                  const formattedTotal = formatMoney(
                    expense.amountMinor,
                    group.currency,
                  );
                  const deleteAction = deleteExpense.bind(
                    null,
                    group.id,
                    expense.id,
                  );

                  return (
                    <li
                      key={`expense-${expense.id}`}
                      className="py-3.5 first:pt-1 last:pb-1"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="truncate text-sm font-semibold text-foreground">
                              {expense.description}
                            </h3>
                            <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                              {formattedTotal}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted">
                            Paid by{" "}
                            <span className="font-medium text-foreground">
                              {payerName}
                            </span>{" "}
                            · {formatShortDate(expense.spentOn)} ·{" "}
                            {describeSplit(expense)}
                          </p>

                          <details className="mt-1.5 group">
                            <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                              <span>View split breakdown</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                                className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </summary>
                            <ul className="mt-2 space-y-1 rounded-lg border border-border bg-background px-3 py-2 text-xs">
                              {expense.shares.map((share) => {
                                const participantName =
                                  memberName.get(share.memberId) ?? "Unknown";
                                return (
                                  <li
                                    key={share.memberId}
                                    className="flex items-center justify-between gap-2"
                                  >
                                    <span className="text-foreground">
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
                                    <span className="font-mono tabular-nums text-muted">
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
      <div className="flex items-center justify-between">
        <div className="h-8 w-28 animate-pulse rounded-lg bg-surface-muted" />
        <div className="h-10 w-28 animate-pulse rounded-lg bg-surface-muted" />
      </div>
      <div className="h-24 animate-pulse rounded-[14px] border border-border bg-surface p-6" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="h-96 animate-pulse rounded-[14px] border border-border bg-surface lg:col-span-7" />
        <div className="h-80 animate-pulse rounded-[14px] border border-border bg-surface lg:col-span-5" />
      </div>
    </div>
  );
}
