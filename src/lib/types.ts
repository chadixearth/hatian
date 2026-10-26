// Shared domain types. Client-safe: no server imports.
// All money is stored and passed as integer minor units (centavos for PHP, yen for JPY).

export const SPLIT_MODES = ["equal", "exact", "shares"] as const;
export type SplitMode = (typeof SPLIT_MODES)[number];

export const CURRENCIES = [
  "PHP",
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "KRW",
  "SGD",
  "HKD",
  "THB",
  "VND",
  "IDR",
  "MYR",
  "AUD",
  "CAD",
  "AED",
] as const;
export type Currency = (typeof CURRENCIES)[number];

export type Member = { id: string; name: string };

export type ExpenseShare = {
  memberId: string;
  amountMinor: number;
  /** Share weight when splitMode is "shares"; null otherwise. */
  weight: number | null;
};

export type Expense = {
  id: string;
  description: string;
  amountMinor: number;
  /** Member id of the payer. */
  paidBy: string;
  /** Calendar date, YYYY-MM-DD. */
  spentOn: string;
  splitMode: SplitMode;
  /** ISO timestamp. */
  createdAt: string;
  shares: ExpenseShare[];
};

/** A recorded repayment: `from` paid `to`. */
export type Settlement = {
  id: string;
  from: string;
  to: string;
  amountMinor: number;
  createdAt: string;
};

/**
 * paidMinor: total this member paid for group expenses. owedMinor: their share of those expenses.
 * netMinor = paid - owed, adjusted by recorded repayments.
 * netMinor > 0: the group owes this member. netMinor < 0: this member owes the group.
 */
export type Balance = {
  memberId: string;
  paidMinor: number;
  owedMinor: number;
  netMinor: number;
};

/** Suggested payment that clears debts: `from` should pay `to`. */
export type Transfer = { from: string; to: string; amountMinor: number };

export type GroupView = {
  id: string;
  name: string;
  currency: Currency;
  createdAt: string;
  /** Ordered by join time. */
  members: Member[];
  /** Newest first (spentOn desc, then createdAt desc). */
  expenses: Expense[];
  /** Newest first. */
  settlements: Settlement[];
  /** One entry per member, same order as `members`. */
  balances: Balance[];
  transfers: Transfer[];
  totalSpentMinor: number;
};

export type ActionState =
  | { status: "idle" }
  | { status: "ok"; at: number }
  | { status: "error"; message: string };

export const IDLE: ActionState = { status: "idle" };
