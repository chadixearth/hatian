import "server-only";
import { asc, desc, eq, inArray } from "drizzle-orm";
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
import type {
  Currency,
  Expense,
  ExpenseShare,
  GroupView,
  Member,
  Settlement,
} from "./types";

/**
 * Full ledger state for any number of groups in a single HTTP round trip to Neon
 * (db.batch runs the five reads in one transaction). Balances and suggested
 * transfers are computed here, so the dashboard, account page, and Excel exports
 * all use the same math. Returned in the order of `ids`; unknown ids are skipped.
 */
export async function getGroupViews(ids: string[]): Promise<GroupView[]> {
  const wanted = [...new Set(ids)].filter((id) => GROUP_ID_PATTERN.test(id));
  if (wanted.length === 0) return [];

  const [groupRows, memberRows, expenseRows, shareRows, settlementRows] =
    await db.batch([
      db.select().from(groups).where(inArray(groups.id, wanted)),
      db
        .select({
          id: members.id,
          name: members.name,
          groupId: members.groupId,
        })
        .from(members)
        .where(inArray(members.groupId, wanted))
        .orderBy(asc(members.id)),
      db
        .select()
        .from(expenses)
        .where(inArray(expenses.groupId, wanted))
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
        .where(inArray(expenses.groupId, wanted)),
      db
        .select()
        .from(settlements)
        .where(inArray(settlements.groupId, wanted))
        .orderBy(desc(settlements.id)),
    ]);

  const membersByGroup = new Map<string, Member[]>();
  const memberOrder = new Map<string, number>();
  for (const { groupId, ...member } of memberRows) {
    const list = membersByGroup.get(groupId) ?? [];
    memberOrder.set(member.id, list.length);
    list.push(member);
    membersByGroup.set(groupId, list);
  }

  const sharesByExpense = new Map<string, ExpenseShare[]>();
  for (const { expenseId, ...share } of shareRows) {
    const list = sharesByExpense.get(expenseId);
    if (list) list.push(share);
    else sharesByExpense.set(expenseId, [share]);
  }

  const expensesByGroup = new Map<string, Expense[]>();
  for (const e of expenseRows) {
    const list = expensesByGroup.get(e.groupId) ?? [];
    list.push({
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
    });
    expensesByGroup.set(e.groupId, list);
  }

  const settlementsByGroup = new Map<string, Settlement[]>();
  for (const s of settlementRows) {
    const list = settlementsByGroup.get(s.groupId) ?? [];
    list.push({
      id: s.id,
      from: s.fromMember,
      to: s.toMember,
      amountMinor: s.amountMinor,
      createdAt: s.createdAt.toISOString(),
    });
    settlementsByGroup.set(s.groupId, list);
  }

  const groupById = new Map(groupRows.map((g) => [g.id, g]));
  return wanted.flatMap((id) => {
    const group = groupById.get(id);
    if (!group) return [];
    const groupMembers = membersByGroup.get(id) ?? [];
    const groupExpenses = expensesByGroup.get(id) ?? [];
    const groupSettlements = settlementsByGroup.get(id) ?? [];
    const balances = computeBalances(
      groupMembers,
      groupExpenses,
      groupSettlements,
    );
    return {
      id: group.id,
      name: group.name,
      // Only CURRENCIES values are ever written (validated in createGroup).
      currency: group.currency as Currency,
      createdAt: group.createdAt.toISOString(),
      members: groupMembers,
      expenses: groupExpenses,
      settlements: groupSettlements,
      balances,
      transfers: suggestTransfers(balances),
      totalSpentMinor: groupExpenses.reduce((sum, e) => sum + e.amountMinor, 0),
    };
  });
}

/**
 * One group's dashboard state. Uncached on purpose: everyone with the link edits
 * the same ledger, so reads must be fresh. React cache() dedupes the call between
 * generateMetadata and the page within one request.
 */
export const getGroupView = cache(
  async (id: string): Promise<GroupView | null> =>
    (await getGroupViews([id]))[0] ?? null,
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
