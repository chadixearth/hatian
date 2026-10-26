"use client";

import { useActionState, useState } from "react";
import { createGroup } from "@/app/actions/groups";
import { CURRENCIES, type Currency, IDLE } from "@/lib/types";

type MemberRow = {
  key: number;
  value: string;
};

const PLACEHOLDERS = [
  "e.g. Ana",
  "e.g. Ben",
  "e.g. Carlo",
  "e.g. Dani",
  "e.g. Eli",
  "e.g. Faye",
];

const CURRENCY_LABELS: Record<Currency, string> = {
  PHP: "PHP (₱) — Philippine Peso",
  USD: "USD ($) — US Dollar",
  EUR: "EUR (€) — Euro",
  GBP: "GBP (£) — British Pound",
  JPY: "JPY (¥) — Japanese Yen",
  KRW: "KRW (₩) — South Korean Won",
  SGD: "SGD ($) — Singapore Dollar",
  HKD: "HKD ($) — Hong Kong Dollar",
  THB: "THB (฿) — Thai Baht",
  VND: "VND (₫) — Vietnamese Dong",
  IDR: "IDR (Rp) — Indonesian Rupiah",
  MYR: "MYR (RM) — Malaysian Ringgit",
  AUD: "AUD ($) — Australian Dollar",
  CAD: "CAD ($) — Canadian Dollar",
  AED: "AED (د.إ) — UAE Dirham",
};

export function CreateGroupForm() {
  const [state, formAction, pending] = useActionState(createGroup, IDLE);
  const [groupName, setGroupName] = useState("");
  const [currency, setCurrency] = useState<Currency>("PHP");
  const [nextKey, setNextKey] = useState(4);
  const [rows, setRows] = useState<MemberRow[]>([
    { key: 1, value: "" },
    { key: 2, value: "" },
    { key: 3, value: "" },
  ]);

  function addRow() {
    if (rows.length >= 30) return;
    setRows((prev) => [...prev, { key: nextKey, value: "" }]);
    setNextKey((k) => k + 1);
  }

  function removeRow(key: number) {
    if (rows.length <= 2) return;
    setRows((prev) => prev.filter((row) => row.key !== key));
  }

  function updateRow(key: number, value: string) {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, value } : row)),
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-[14px] border border-border bg-surface p-5 shadow-2xs sm:p-6"
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label
              htmlFor="group-name"
              className="block text-sm font-medium text-foreground"
            >
              Group or trip name
            </label>
            <input
              id="group-name"
              name="name"
              type="text"
              required
              maxLength={60}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Siargao Barkada, Unit 4B Bills"
              className="mt-1.5 block min-h-11 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
          </div>

          <div>
            <label
              htmlFor="group-currency"
              className="block text-sm font-medium text-foreground"
            >
              Currency
            </label>
            <select
              id="group-currency"
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="mt-1.5 block min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {CURRENCY_LABELS[code]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <legend className="text-sm font-medium text-foreground">
              Who’s splitting?
            </legend>
            <span className="text-xs text-muted">
              At least 2 people ({rows.length}/30)
            </span>
          </div>

          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={row.key} className="flex items-center gap-2">
                <label htmlFor={`member-${row.key}`} className="sr-only">
                  Person {index + 1} name
                </label>
                <input
                  id={`member-${row.key}`}
                  name="member"
                  type="text"
                  maxLength={30}
                  required={index < 2}
                  value={row.value}
                  onChange={(e) => updateRow(row.key, e.target.value)}
                  placeholder={PLACEHOLDERS[index] ?? `Person ${index + 1}`}
                  className="block min-h-11 flex-1 rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                />
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length <= 2}
                  aria-label={`Remove person ${index + 1}`}
                  className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            disabled={rows.length >= 30}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-surface-muted/70 px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className="h-4 w-4 text-accent"
            >
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Add person
          </button>
        </fieldset>

        <div aria-live="polite" className="min-h-1">
          {state.status === "error" && (
            <p
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm font-medium text-danger"
            >
              {state.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Creating group…" : "Create group"}
        </button>
      </div>
    </form>
  );
}
