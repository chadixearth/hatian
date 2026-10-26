import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import {
  expenseShares,
  expenses,
  groups,
  members,
  settlements,
} from "@/db/schema";
import { GROUP_ID_PATTERN } from "./ids";
import { computeBalances, suggestTransfers } from "./ledger";
import type { Currency, Expense, ExpenseShare, GroupView } from "./types";

/**
 * Full dashboard state for one group in a single HTTP round trip to Neon
 * (db.batch runs the five reads in one transaction). Uncached on purpose:
 * everyone with the link edits the same ledger, so reads must be fresh.
 * React cache() dedupes the call between generateMetadata and the page.
 */
export const getGroupView = cache(
  async (id: string): Promise<GroupView | null> => {
    if (!GROUP_ID_PATTERN.test(id)) return null;

    const [groupRows, memberRows, expenseRows, shareRows, settlementRows] =
      await db.batch([
        db.select().from(groups).where(eq(groups.id, id)),
        db
          .select({ id: members.id, name: members.name })
          .from(members)
          .where(eq(members.groupId, id))
          .orderBy(asc(members.id)),
        db
          .select()
          .from(expenses)
          .where(eq(expenses.groupId, id))
          .orderBy(desc(expenses.spentOn), desc(expenses.id)),
        db
          .select({
            expenseId: expenseShares.expenseId,
            memberId: expenseShares.memberId,
            amountMinor: expenseShares.amountMinor,
            weight: expenseShares.weight,
          })
          .from(expenseShares)
          .innerJoin(expenses, eq(expenseShares.expenseId, expenses.id))
          .where(eq(expenses.groupId, id)),
        db
          .select()
          .from(settlements)
          .where(eq(settlements.groupId, id))
          .orderBy(desc(settlements.id)),
      ]);

    const group = groupRows[0];
    if (!group) return null;

    const memberOrder = new Map(memberRows.map((m, index) => [m.id, index]));
    const sharesByExpense = new Map<string, ExpenseShare[]>();
    for (const { expenseId, ...share } of shareRows) {
      const list = sharesByExpense.get(expenseId);
      if (list) list.push(share);
      else sharesByExpense.set(expenseId, [share]);
    }

    const expenseList: Expense[] = expenseRows.map((e) => ({
      id: e.id,
      description: e.description,
      amountMinor: e.amountMinor,
      paidBy: e.paidBy,
      spentOn: e.spentOn,
      splitMode: e.splitMode,
      createdAt: e.createdAt.toISOString(),
      shares: (sharesByExpense.get(e.id) ?? []).sort(
        (a, b) =>
          (memberOrder.get(a.memberId) ?? 0) -
          (memberOrder.get(b.memberId) ?? 0),
      ),
    }));
    const settlementList = settlementRows.map((s) => ({
      id: s.id,
      from: s.fromMember,
      to: s.toMember,
      amountMinor: s.amountMinor,
      createdAt: s.createdAt.toISOString(),
    }));
    const balances = computeBalances(memberRows, expenseList, settlementList);

    return {
      id: group.id,
      name: group.name,
      // Only CURRENCIES values are ever written (validated in createGroup).
      currency: group.currency as Currency,
      createdAt: group.createdAt.toISOString(),
      members: memberRows,
      expenses: expenseList,
      settlements: settlementList,
      balances,
      transfers: suggestTransfers(balances),
      totalSpentMinor: expenseList.reduce((sum, e) => sum + e.amountMinor, 0),
    };
  },
);

/** Currency and member ids of a group, for validating writes. */
export async function getGroupForWrite(
  id: string,
): Promise<{ currency: Currency; memberIds: string[] } | null> {
  if (!GROUP_ID_PATTERN.test(id)) return null;
  const [groupRows, memberRows] = await db.batch([
    db
      .select({ currency: groups.currency })
      .from(groups)
      .where(eq(groups.id, id)),
    db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.groupId, id))
      .orderBy(asc(members.id)),
  ]);
  const group = groupRows[0];
  if (!group) return null;
  return {
    currency: group.currency as Currency,
    memberIds: memberRows.map((m) => m.id),
  };
}
