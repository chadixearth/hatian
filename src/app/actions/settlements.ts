"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { settlements } from "@/db/schema";
import { getGroupForWrite } from "@/lib/data";
import { UUID_PATTERN } from "@/lib/ids";
import { MAX_AMOUNT_MINOR, parseMoney } from "@/lib/money";
import type { ActionState } from "@/lib/types";

export async function recordSettlement(
  groupId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const group = await getGroupForWrite(groupId);
  if (!group)
    return { status: "error", message: "This group no longer exists" };

  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "");
  if (!group.memberIds.includes(from) || !group.memberIds.includes(to)) {
    return { status: "error", message: "Pick who paid and who received" };
  }
  if (from === to)
    return { status: "error", message: "Pick two different people" };

  const amountMinor = parseMoney(
    String(formData.get("amount") ?? ""),
    group.currency,
  );
  if (!amountMinor || amountMinor > MAX_AMOUNT_MINOR) {
    return { status: "error", message: "Enter an amount greater than zero" };
  }

  await db
    .insert(settlements)
    .values({ groupId, fromMember: from, toMember: to, amountMinor });
  refresh();
  return { status: "ok", at: Date.now() };
}

export async function deleteSettlement(
  groupId: string,
  settlementId: string,
): Promise<void> {
  if (!UUID_PATTERN.test(settlementId)) return;
  await db
    .delete(settlements)
    .where(
      and(eq(settlements.id, settlementId), eq(settlements.groupId, groupId)),
    );
  refresh();
}
