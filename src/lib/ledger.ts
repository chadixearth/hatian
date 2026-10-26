// Pure money math for splitting and settling. Client-safe; all amounts are integer
// minor units, so every split sums exactly to its total.

import type { Balance, Member, Transfer } from "./types";

/** Equal split; leftover minor units go one each to the first ids. */
export function splitEqual(
  totalMinor: number,
  memberIds: string[],
): Map<string, number> {
  const out = new Map<string, number>();
  const n = memberIds.length;
  if (n === 0) return out;
  const base = Math.floor(totalMinor / n);
  let leftover = totalMinor - base * n;
  for (const id of memberIds) {
    out.set(id, base + (leftover > 0 ? 1 : 0));
    if (leftover > 0) leftover--;
  }
  return out;
}

/**
 * Proportional split by integer weights using the largest-remainder method
 * (ties go to the earlier entry). Entries with weight <= 0 are left out.
 */
export function splitByShares(
  totalMinor: number,
  weights: { memberId: string; weight: number }[],
): Map<string, number> {
  const out = new Map<string, number>();
  const positive = weights.filter((w) => w.weight > 0);
  const weightSum = positive.reduce((sum, w) => sum + w.weight, 0);
  if (weightSum === 0) return out;

  const parts = positive.map((w, index) => {
    const scaled = totalMinor * w.weight; // exact: stays far below 2^53 for validated input
    return {
      memberId: w.memberId,
      minor: Math.floor(scaled / weightSum),
      remainder: scaled % weightSum,
      index,
    };
  });
  let leftover = totalMinor - parts.reduce((sum, p) => sum + p.minor, 0);
  const byRemainder = [...parts].sort(
    (a, b) => b.remainder - a.remainder || a.index - b.index,
  );
  for (const part of byRemainder) {
    if (leftover === 0) break;
    part.minor++;
    leftover--;
  }
  for (const part of parts) out.set(part.memberId, part.minor);
  return out;
}

type LedgerExpense = {
  amountMinor: number;
  paidBy: string;
  shares: { memberId: string; amountMinor: number }[];
};
type LedgerSettlement = { from: string; to: string; amountMinor: number };

/** Per-member balances in `members` order. Net = paid - owed + repaid - received. */
export function computeBalances(
  members: Member[],
  expenses: LedgerExpense[],
  settlements: LedgerSettlement[],
): Balance[] {
  const byId = new Map<string, Balance>(
    members.map((m) => [
      m.id,
      { memberId: m.id, paidMinor: 0, owedMinor: 0, netMinor: 0 },
    ]),
  );
  const get = (id: string) => {
    const balance = byId.get(id);
    if (!balance) throw new Error(`Unknown member ${id}`);
    return balance;
  };
  for (const expense of expenses) {
    get(expense.paidBy).paidMinor += expense.amountMinor;
    for (const share of expense.shares)
      get(share.memberId).owedMinor += share.amountMinor;
  }
  for (const balance of byId.values())
    balance.netMinor = balance.paidMinor - balance.owedMinor;
  for (const s of settlements) {
    get(s.from).netMinor += s.amountMinor;
    get(s.to).netMinor -= s.amountMinor;
  }
  return [...byId.values()];
}

/**
 * Payments that zero every balance, using at most (people with a balance - 1)
 * transfers: equal debt/credit pairs are matched first, then the largest debtor
 * pays the largest creditor until everyone is square.
 */
export function suggestTransfers(balances: Balance[]): Transfer[] {
  type Open = { id: string; amount: number; order: number };
  const byLargest = (a: Open, b: Open) =>
    b.amount - a.amount || a.order - b.order;
  const debtors: Open[] = [];
  const creditors: Open[] = [];
  balances.forEach((b, order) => {
    if (b.netMinor < 0)
      debtors.push({ id: b.memberId, amount: -b.netMinor, order });
    else if (b.netMinor > 0)
      creditors.push({ id: b.memberId, amount: b.netMinor, order });
  });
  debtors.sort(byLargest);
  creditors.sort(byLargest);

  const transfers: Transfer[] = [];
  for (const debtor of debtors) {
    const match = creditors.find((c) => c.amount === debtor.amount);
    if (!match) continue;
    transfers.push({
      from: debtor.id,
      to: match.id,
      amountMinor: debtor.amount,
    });
    debtor.amount = 0;
    match.amount = 0;
  }

  let d = 0;
  let c = 0;
  const openDebtors = debtors.filter((x) => x.amount > 0);
  const openCreditors = creditors.filter((x) => x.amount > 0);
  while (d < openDebtors.length && c < openCreditors.length) {
    const debtor = openDebtors[d];
    const creditor = openCreditors[c];
    const amount = Math.min(debtor.amount, creditor.amount);
    transfers.push({ from: debtor.id, to: creditor.id, amountMinor: amount });
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) d++;
    if (creditor.amount === 0) c++;
  }
  return transfers;
}
