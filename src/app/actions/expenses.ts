"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { expenseShares, expenses } from "@/db/schema";
import { getGroupForWrite } from "@/lib/data";
import { UUID_PATTERN, uuidv7 } from "@/lib/ids";
import { splitByShares, splitEqual } from "@/lib/ledger";
import { formatMoney, MAX_AMOUNT_MINOR, parseMoney } from "@/lib/money";
import { type ActionState, SPLIT_MODES } from "@/lib/types";

const MAX_SHARE_WEIGHT = 1000;

const expenseInput = z.object({
  description: z
    .string()
    .trim()
    .min(1, "What was it for?")
    .max(80, "Keep the description under 80 characters"),
  amount: z.string(),
  paidBy: z.string(),
  spentOn: z.union([z.iso.date("Pick a valid date"), z.literal("")]),
  splitMode: z.enum(SPLIT_MODES, "Pick how to split it"),
});

type ShareRow = {
  memberId: string;
  amountMinor: number;
  weight: number | null;
};

export async function addExpense(
  groupId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = expenseInput.safeParse({
    description: formData.get("description"),
    amount: formData.get("amount") ?? "",
    paidBy: formData.get("paidBy") ?? "",
    spentOn: formData.get("spentOn") ?? "",
    splitMode: formData.get("splitMode"),
  });
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0].message };
  const input = parsed.data;

  const group = await getGroupForWrite(groupId);
  if (!group)
    return { status: "error", message: "This group no longer exists" };
  const { currency, memberIds } = group;

  const amountMinor = parseMoney(input.amount, currency);
  if (!amountMinor || amountMinor > MAX_AMOUNT_MINOR) {
    return { status: "error", message: "Enter an amount greater than zero" };
  }
  if (!memberIds.includes(input.paidBy))
    return { status: "error", message: "Pick who paid" };

  let shares: ShareRow[];
  if (input.splitMode === "equal") {
    const picked = new Set(formData.getAll("participant").map(String));
    const participants = memberIds.filter((id) => picked.has(id));
    if (participants.length === 0)
      return {
        status: "error",
        message: "Pick at least one person to split with",
      };
    shares = [...splitEqual(amountMinor, participants)].map(
      ([memberId, minor]) => ({
        memberId,
        amountMinor: minor,
        weight: null,
      }),
    );
  } else if (input.splitMode === "exact") {
    shares = [];
    let sum = 0;
    for (const memberId of memberIds) {
      const raw = String(formData.get(`exact:${memberId}`) ?? "").trim();
      if (raw === "") continue;
      const minor = parseMoney(raw, currency);
      if (minor === null)
        return { status: "error", message: `"${raw}" is not a valid amount` };
      if (minor === 0) continue;
      shares.push({ memberId, amountMinor: minor, weight: null });
      sum += minor;
    }
    if (sum !== amountMinor) {
      return {
        status: "error",
        message: `The amounts add up to ${formatMoney(sum, currency)}, but the total is ${formatMoney(amountMinor, currency)}`,
      };
    }
  } else {
    const weights: { memberId: string; weight: number }[] = [];
    for (const memberId of memberIds) {
      const raw = String(formData.get(`shares:${memberId}`) ?? "").trim();
      if (raw === "") continue;
      const weight = Number(raw);
      if (
        !Number.isInteger(weight) ||
        weight < 0 ||
        weight > MAX_SHARE_WEIGHT
      ) {
        return {
          status: "error",
          message: `Shares must be whole numbers from 0 to ${MAX_SHARE_WEIGHT}`,
        };
      }
      if (weight > 0) weights.push({ memberId, weight });
    }
    if (weights.length === 0)
      return { status: "error", message: "Give at least one person a share" };
    const split = splitByShares(amountMinor, weights);
    shares = weights.map(({ memberId, weight }) => ({
      memberId,
      amountMinor: split.get(memberId) ?? 0,
      weight,
    }));
  }

  const expenseId = uuidv7();
  await db.batch([
    db.insert(expenses).values({
      id: expenseId,
      groupId,
      description: input.description,
      amountMinor,
      paidBy: input.paidBy,
      // Fallback only; the form sends the user's local date.
      spentOn:
        input.spentOn ||
        new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }),
      splitMode: input.splitMode,
    }),
    db
      .insert(expenseShares)
      .values(shares.map((share) => ({ expenseId, ...share }))),
  ]);
  refresh();
  return { status: "ok", at: Date.now() };
}

export async function deleteExpense(
  groupId: string,
  expenseId: string,
): Promise<void> {
  if (!UUID_PATTERN.test(expenseId)) return;
  await db
    .delete(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.groupId, groupId)));
  refresh();
}
