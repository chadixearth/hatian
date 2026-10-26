"use client";

import { ArrowRight, Check, ChevronDown, HandCoins } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { recordSettlement } from "@/app/actions/settlements";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { formatMoney, toDecimalString } from "@/lib/money";
import { type Currency, IDLE, type Member, type Transfer } from "@/lib/types";

export function SettleUpCard({
  groupId,
  currency,
  members,
  transfers,
}: {
  groupId: string;
  currency: Currency;
  members: Member[];
  transfers: Transfer[];
}) {
  const boundRecordSettlement = recordSettlement.bind(null, groupId);
  const [state, formAction, pending] = useActionState(
    boundRecordSettlement,
    IDLE,
  );

  const [fromId, setFromId] = useState(members[0]?.id ?? "");
  const [toId, setToId] = useState(members[1]?.id ?? members[0]?.id ?? "");
  const [customAmount, setCustomAmount] = useState("");
  const [lastResetAt, setLastResetAt] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.status === "ok" && state.at !== lastResetAt) {
      setLastResetAt(state.at);
      setCustomAmount("");
      setShowSuccess(true);
      const timer = window.setTimeout(() => setShowSuccess(false), 3500);
      return () => window.clearTimeout(timer);
    }
  }, [state, lastResetAt]);

  const memberName = new Map(members.map((m) => [m.id, m.name]));
  const memberIndex = new Map(members.map((m, idx) => [m.id, idx]));
  const effectiveFrom = members.some((m) => m.id === fromId)
    ? fromId
    : (members[0]?.id ?? "");
  const effectiveTo = members.some((m) => m.id === toId)
    ? toId
    : (members[1]?.id ?? members[0]?.id ?? "");

  return (
    <section
      aria-labelledby="settle-up-heading"
      className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HandCoins
            className="size-[18px] text-accent"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <h2
            id="settle-up-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            Settle up
          </h2>
        </div>
        <span className="text-xs text-muted">Fewest transfers</span>
      </div>

      {transfers.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-get-border bg-get-bg px-4 py-3 text-sm font-medium text-get">
          <Check
            className="size-4 shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span>All square — everyone is settled up.</span>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-background">
          {transfers.map((t) => {
            const payer = memberName.get(t.from) ?? "Unknown";
            const receiver = memberName.get(t.to) ?? "Unknown";
            const payerIdx = memberIndex.get(t.from) ?? 0;
            const receiverIdx = memberIndex.get(t.to) ?? 0;
            const formatted = formatMoney(t.amountMinor, currency);
            const decimalAmount = toDecimalString(t.amountMinor, currency);

            return (
              <li
                key={`${t.from}-${t.to}`}
                className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <MemberAvatar name={payer} index={payerIdx} size="sm" />
                    <ArrowRight
                      className="size-4 shrink-0 text-muted"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <MemberAvatar
                      name={receiver}
                      index={receiverIdx}
                      size="sm"
                    />
                    <p className="min-w-0 break-words text-sm text-foreground">
                      <span className="font-semibold">{payer}</span>{" "}
                      <span className="text-muted">→</span>{" "}
                      <span className="font-semibold">{receiver}</span>
                    </p>
                  </div>
                  <p className="text-base font-semibold tracking-tight tabular-nums text-foreground">
                    {formatted}
                  </p>
                </div>

                <form action={formAction}>
                  <input type="hidden" name="from" value={t.from} />
                  <input type="hidden" name="to" value={t.to} />
                  <input type="hidden" name="amount" value={decimalAmount} />
                  <button
                    type="submit"
                    disabled={pending}
                    aria-label={`Mark ${payer} paying ${receiver} ${formatted} as paid`}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:bg-get-bg hover:text-get focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-50"
                  >
                    <Check
                      className="size-3.5"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span>{pending ? "Saving…" : "Mark as paid"}</span>
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      <details className="mt-4 group">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-xl px-1 text-xs font-semibold text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          <ChevronDown
            className="size-4 transition-transform group-open:rotate-180"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>Record a payment manually</span>
        </summary>

        <form
          action={formAction}
          className="mt-2 space-y-3 rounded-xl border border-border bg-background p-3.5"
        >
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="settlement-from"
                className="block text-xs font-medium text-muted"
              >
                Payer (from)
              </label>
              <select
                id="settlement-from"
                name="from"
                value={effectiveFrom}
                onChange={(e) => setFromId(e.target.value)}
                className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-surface px-2.5 py-2 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="settlement-to"
                className="block text-xs font-medium text-muted"
              >
                Receiver (to)
              </label>
              <select
                id="settlement-to"
                name="to"
                value={effectiveTo}
                onChange={(e) => setToId(e.target.value)}
                className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-surface px-2.5 py-2 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label
                htmlFor="settlement-amount"
                className="block text-xs font-medium text-muted"
              >
                Amount ({currency})
              </label>
              <input
                id="settlement-amount"
                name="amount"
                type="text"
                inputMode="decimal"
                required
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm tabular-nums text-foreground placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "Saving…" : "Record"}
            </button>
          </div>
        </form>
      </details>

      <div aria-live="polite" className="min-h-1">
        {state.status === "error" && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-danger/30 bg-danger-bg px-3 py-2 text-xs font-medium text-danger"
          >
            {state.message}
          </p>
        )}
        {showSuccess && state.status === "ok" && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-get-border bg-get-bg px-3 py-2 text-xs font-medium text-get">
            <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
            <span>Payment recorded</span>
          </p>
        )}
      </div>
    </section>
  );
}
