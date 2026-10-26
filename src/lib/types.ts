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

/** Signed-in Google account (Neon Auth user). */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

/** Who is looking at a group page. */
export type GroupViewer = {
  user: SessionUser | null;
  /** Member this account is linked to in the group ("this is me"), if any. */
  memberId: string | null;
  /** Members already linked to some other account; they can't be picked. */
  claimedMemberIds: string[];
};

/** One group saved to the signed-in account. */
export type MyGroup = {
  id: string;
  name: string;
  currency: Currency;
  memberCount: number;
  expenseCount: number;
  totalSpentMinor: number;
  myMemberId: string | null;
  myMemberName: string | null;
  /** The linked member's balance (same sign rules as Balance.netMinor); null when not linked. */
  myNetMinor: number | null;
  /** ISO time of the newest expense or payment; null when the group is empty. */
  lastActivityAt: string | null;
  /** ISO time this account last opened the group. */
  lastViewedAt: string;
};

/** Totals across linked groups for one currency. Both values are >= 0. */
export type CurrencyTotal = {
  currency: Currency;
  owedToMeMinor: number;
  iOweMinor: number;
};

export type MyGroupsView = {
  user: SessionUser;
  /** Most recently viewed first. */
  groups: MyGroup[];
  /** One row per currency that has at least one linked member; currencies sorted A-Z. */
  totals: CurrencyTotal[];
};

export type ActionState =
  | { status: "idle" }
  | { status: "ok"; at: number }
  | { status: "error"; message: string };

export const IDLE: ActionState = { status: "idle" };
