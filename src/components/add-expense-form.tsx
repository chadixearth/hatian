"use client";

import { Check, Plus, Receipt, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { addExpense } from "@/app/actions/expenses";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { splitByShares, splitEqual } from "@/lib/ledger";
import { formatMoney, minorDigits, parseMoney } from "@/lib/money";
import {
  type Currency,
  IDLE,
  type Member,
  SPLIT_MODES,
  type SplitMode,
} from "@/lib/types";

function todayLocalISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const SPLIT_MODE_LABELS: Record<SplitMode, string> = {
  equal: "Equal",
  exact: "Exact amounts",
  shares: "Shares",
};

export function AddExpenseForm({
  groupId,
  currency,
  members,
  defaultPaidBy = null,
}: {
  groupId: string;
  currency: Currency;
  members: Member[];
  defaultPaidBy?: string | null;
}) {
  const boundAddExpense = addExpense.bind(null, groupId);
  const [state, formAction, pending] = useActionState(boundAddExpense, IDLE);

  const preferredPayerId =
    defaultPaidBy && members.some((m) => m.id === defaultPaidBy)
      ? defaultPaidBy
      : (members[0]?.id ?? "");

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(preferredPayerId);
  const [spentOn, setSpentOn] = useState(todayLocalISO);
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [shareWeights, setShareWeights] = useState<Record<string, string>>({});
  const [lastResetAt, setLastResetAt] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Sync default payer when viewer links their member
  useEffect(() => {
    if (defaultPaidBy && members.some((m) => m.id === defaultPaidBy)) {
      setPaidBy(defaultPaidBy);
    }
  }, [defaultPaidBy, members]);

  // Track viewport size (<lg uses bottom-sheet dialog; lg+ stays inline)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => {
      const matches = mq.matches;
      setIsMobile(matches);
      if (!matches && dialogRef.current?.open) {
        dialogRef.current.close();
      }
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Intercept mobile clicks on <a href="#add-expense"> in the group header card
  useEffect(() => {
    function handleDocumentClick(e: MouseEvent) {
      if (!window.matchMedia("(max-width: 1023px)").matches) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest(
        'a[href="#add-expense"], [data-open-add-expense]',
      );
      if (trigger) {
        e.preventDefault();
        if (dialogRef.current && !dialogRef.current.open) {
          dialogRef.current.showModal();
        }
      }
    }
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  useEffect(() => {
    if (state.status === "ok" && state.at !== lastResetAt) {
      setLastResetAt(state.at);
      setDescription("");
      setAmount("");
      setSplitMode("equal");
      setExcludedIds([]);
      setExactAmounts({});
      setShareWeights({});
      if (dialogRef.current?.open) {
        dialogRef.current.close();
      }
      setShowSuccess(true);
      const timer = window.setTimeout(() => setShowSuccess(false), 3500);
      return () => window.clearTimeout(timer);
    }
  }, [state, lastResetAt]);

  function openMobileSheet() {
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }

  function closeMobileSheet() {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }

  const effectivePaidBy = members.some((m) => m.id === paidBy)
    ? paidBy
    : preferredPayerId;

  const parsedTotalMinor = parseMoney(amount.trim(), currency) ?? 0;
  const digits = minorDigits(currency);
  const amountPlaceholder = digits === 0 ? "0" : `0.${"0".repeat(digits)}`;

  const activeParticipantIds = members
    .filter((m) => !excludedIds.includes(m.id))
    .map((m) => m.id);

  const equalPreview =
    parsedTotalMinor > 0 && activeParticipantIds.length > 0
      ? splitEqual(parsedTotalMinor, activeParticipantIds)
      : new Map<string, number>();

  const weightsList = members.map((m) => {
    const raw = shareWeights[m.id] ?? "1";
    const parsed = Number.parseInt(raw, 10);
    return {
      memberId: m.id,
      weight: Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
    };
  });
  const totalWeight = weightsList.reduce((sum, item) => sum + item.weight, 0);
  const sharesPreview =
    parsedTotalMinor > 0 && totalWeight > 0
      ? splitByShares(parsedTotalMinor, weightsList)
      : new Map<string, number>();

  const assignedExactMinor = members.reduce((sum, m) => {
    const val = (exactAmounts[m.id] ?? "").trim();
    if (!val) return sum;
    return sum + (parseMoney(val, currency) ?? 0);
  }, 0);
  const remainingExactMinor = parsedTotalMinor - assignedExactMinor;

  function toggleParticipant(memberId: string) {
    setExcludedIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  }

  function stepShare(memberId: string, delta: number) {
    setShareWeights((prev) => {
      const current = Number.parseInt(prev[memberId] ?? "1", 10);
      const safeCurrent = Number.isFinite(current) ? current : 1;
      const next = Math.max(0, safeCurrent + delta);
      return { ...prev, [memberId]: String(next) };
    });
  }

  const formElement = (
    <form action={formAction} className="mt-4 space-y-4">
      <div className="grid gap-3.5 sm:grid-cols-5">
        <div className="sm:col-span-3">
          <label
            htmlFor="expense-description"
            className="block text-xs font-medium text-muted"
          >
            What was it for?
          </label>
          <input
            id="expense-description"
            name="description"
            type="text"
            required
            maxLength={80}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Grab from airport, Dinner at Manam"
            className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="expense-amount"
            className="block text-xs font-medium text-muted"
          >
            Amount ({currency})
          </label>
          <input
            id="expense-amount"
            name="amount"
            type="text"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={amountPlaceholder}
            className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium tabular-nums text-foreground placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="expense-paid-by"
            className="block text-xs font-medium text-muted"
          >
            Paid by
          </label>
          <select
            id="expense-paid-by"
            name="paidBy"
            value={effectivePaidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
            htmlFor="expense-spent-on"
            className="block text-xs font-medium text-muted"
          >
            Date
          </label>
          <input
            id="expense-spent-on"
            name="spentOn"
            type="date"
            value={spentOn}
            onChange={(e) => setSpentOn(e.target.value)}
            className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </div>
      </div>

      <input type="hidden" name="splitMode" value={splitMode} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            id="split-mode-label"
            className="text-xs font-medium text-muted"
          >
            Split method
          </span>
          {splitMode === "equal" && (
            <span className="text-xs text-muted">
              {activeParticipantIds.length} of {members.length} included
            </span>
          )}
          {splitMode === "exact" && (
            <span
              aria-live="polite"
              className={`text-xs font-medium tabular-nums ${
                remainingExactMinor === 0 && parsedTotalMinor > 0
                  ? "text-get"
                  : remainingExactMinor < 0
                    ? "text-danger"
                    : "text-owe"
              }`}
            >
              {parsedTotalMinor === 0
                ? "Enter amount above"
                : remainingExactMinor === 0
                  ? "Exact match ✓"
                  : remainingExactMinor > 0
                    ? `${formatMoney(remainingExactMinor, currency)} remaining`
                    : `Over by ${formatMoney(Math.abs(remainingExactMinor), currency)}`}
            </span>
          )}
          {splitMode === "shares" && (
            <span className="text-xs tabular-nums text-muted">
              {totalWeight} total {totalWeight === 1 ? "share" : "shares"}
            </span>
          )}
        </div>

        <fieldset
          aria-labelledby="split-mode-label"
          className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface-muted p-1"
        >
          {SPLIT_MODES.map((mode) => {
            const active = splitMode === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                onClick={() => setSplitMode(mode)}
                className={`min-h-11 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  active
                    ? "bg-surface text-foreground shadow-card"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {SPLIT_MODE_LABELS[mode]}
              </button>
            );
          })}
        </fieldset>

        {splitMode === "equal" && (
          <ul className="divide-y divide-border rounded-xl border border-border bg-background">
            {members.map((member, index) => {
              const checked = !excludedIds.includes(member.id);
              const shareMinor = equalPreview.get(member.id) ?? 0;
              return (
                <li key={member.id}>
                  <label
                    htmlFor={`participant-${member.id}`}
                    className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-sm transition-colors hover:bg-surface-muted/50"
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        id={`participant-${member.id}`}
                        type="checkbox"
                        name="participant"
                        value={member.id}
                        checked={checked}
                        onChange={() => toggleParticipant(member.id)}
                        className="size-4 rounded border-border accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      />
                      <MemberAvatar
                        name={member.name}
                        index={index}
                        size="xs"
                      />
                      <span
                        className={
                          checked
                            ? "font-medium text-foreground"
                            : "text-muted line-through"
                        }
                      >
                        {member.name}
                      </span>
                    </span>
                    <span className="text-xs font-medium tabular-nums text-muted">
                      {checked
                        ? formatMoney(shareMinor, currency)
                        : formatMoney(0, currency)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {splitMode === "exact" && (
          <ul className="divide-y divide-border rounded-xl border border-border bg-background">
            {members.map((member, index) => {
              const val = exactAmounts[member.id] ?? "";
              return (
                <li
                  key={member.id}
                  className="flex min-h-12 items-center justify-between gap-3 px-3.5 py-2"
                >
                  <label
                    htmlFor={`exact-${member.id}`}
                    className="flex items-center gap-2.5 text-sm font-medium text-foreground"
                  >
                    <MemberAvatar name={member.name} index={index} size="xs" />
                    <span>{member.name}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted">{currency}</span>
                    <input
                      id={`exact-${member.id}`}
                      name={`exact:${member.id}`}
                      type="text"
                      inputMode="decimal"
                      value={val}
                      onChange={(e) =>
                        setExactAmounts((prev) => ({
                          ...prev,
                          [member.id]: e.target.value,
                        }))
                      }
                      placeholder={amountPlaceholder}
                      className="min-h-11 w-28 rounded-xl border border-border bg-surface px-3 py-1.5 text-right text-sm tabular-nums text-foreground placeholder:text-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {splitMode === "shares" && (
          <ul className="divide-y divide-border rounded-xl border border-border bg-background">
            {members.map((member, index) => {
              const weightStr = shareWeights[member.id] ?? "1";
              const shareMinor = sharesPreview.get(member.id) ?? 0;
              return (
                <li
                  key={member.id}
                  className="flex min-h-12 flex-wrap items-center justify-between gap-3 px-3.5 py-2"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <MemberAvatar name={member.name} index={index} size="xs" />
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={`shares-${member.id}`}
                        className="block truncate text-sm font-medium text-foreground"
                      >
                        {member.name}
                      </label>
                      <span className="text-xs tabular-nums text-muted">
                        {formatMoney(shareMinor, currency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => stepShare(member.id, -1)}
                      aria-label={`Decrease shares for ${member.name}`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-surface text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      −
                    </button>
                    <input
                      id={`shares-${member.id}`}
                      name={`shares:${member.id}`}
                      type="text"
                      inputMode="numeric"
                      value={weightStr}
                      onChange={(e) =>
                        setShareWeights((prev) => ({
                          ...prev,
                          [member.id]: e.target.value,
                        }))
                      }
                      className="min-h-11 w-14 rounded-xl border border-border bg-surface px-2 py-1.5 text-center text-sm tabular-nums text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    />
                    <button
                      type="button"
                      onClick={() => stepShare(member.id, 1)}
                      aria-label={`Increase shares for ${member.name}`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-surface text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div aria-live="polite" className="min-h-1">
        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-xs font-medium text-danger"
          >
            {state.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
      >
        <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
        <span>{pending ? "Adding expense…" : "Add expense"}</span>
      </button>
    </form>
  );

  return (
    <>
      <div aria-live="polite" className="empty:hidden">
        {showSuccess && state.status === "ok" && (
          <output className="flex items-center gap-2 rounded-2xl border border-get-border bg-get-bg px-4 py-3 text-sm font-medium text-get shadow-card">
            <Check
              className="size-4 shrink-0"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span>Expense added</span>
          </output>
        )}
      </div>

      {isMobile ? (
        <dialog
          ref={dialogRef}
          id="add-expense"
          aria-labelledby="add-expense-heading"
          onClick={(e) => {
            if (e.target === dialogRef.current) {
              closeMobileSheet();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              closeMobileSheet();
            }
          }}
          className="fixed inset-x-0 bottom-0 top-auto z-50 m-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 text-foreground shadow-card backdrop:bg-black/50 sm:p-6"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Receipt
                className="size-[18px] text-accent"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <h2
                id="add-expense-heading"
                className="text-base font-semibold tracking-tight text-foreground"
              >
                Add expense
              </h2>
            </div>
            <button
              type="button"
              onClick={closeMobileSheet}
              aria-label="Close add expense form"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
          {formElement}
        </dialog>
      ) : (
        <section
          id="add-expense"
          aria-labelledby="add-expense-heading"
          className="hidden scroll-mt-4 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6 lg:block"
        >
          <div className="flex items-center gap-2">
            <Receipt
              className="size-[18px] text-accent"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <h2
              id="add-expense-heading"
              className="text-base font-semibold tracking-tight text-foreground"
            >
              Add expense
            </h2>
          </div>
          {formElement}
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur-xs lg:hidden">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={openMobileSheet}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg shadow-card transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
            <span>Add expense</span>
          </button>
        </div>
      </div>
    </>
  );
}
