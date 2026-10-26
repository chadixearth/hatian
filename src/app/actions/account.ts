"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, pgErrorCode } from "@/db";
import { groupFollows, groups } from "@/db/schema";
import { getSessionUser } from "@/lib/account";
import { getGroupForWrite } from "@/lib/data";
import { GROUP_ID_PATTERN } from "@/lib/ids";
import type { ActionState } from "@/lib/types";

const MAX_IMPORT = 50;

/** Saves the group to the signed-in account (or bumps its last-viewed time). No-op when signed out. */
export async function trackGroup(groupId: string): Promise<void> {
  if (!GROUP_ID_PATTERN.test(groupId)) return;
  const user = await getSessionUser();
  if (!user) return;
  try {
    await db
      .insert(groupFollows)
      .values({ userId: user.id, groupId })
      .onConflictDoUpdate({
        target: [groupFollows.userId, groupFollows.groupId],
        set: { lastViewedAt: sql`now()` },
      });
  } catch (error) {
    if (pgErrorCode(error) === "23503") return; // group was deleted or never existed
    throw error;
  }
}

/** Saves groups this device opened before signing in. Unknown ids are ignored. */
export async function importRecentGroups(groupIds: string[]): Promise<void> {
  const user = await getSessionUser();
  if (!user || !Array.isArray(groupIds)) return;
  const ids = [
    ...new Set(
      groupIds.filter(
        (id): id is string =>
          typeof id === "string" && GROUP_ID_PATTERN.test(id),
      ),
    ),
  ].slice(0, MAX_IMPORT);
  if (ids.length === 0) return;
  const existing = await db
    .select({ id: groups.id })
    .from(groups)
    .where(inArray(groups.id, ids));
  if (existing.length === 0) return;
  await db
    .insert(groupFollows)
    .values(existing.map((g) => ({ userId: user.id, groupId: g.id })))
    .onConflictDoNothing();
}

/** Links the account to one member of the group ("this is me"); memberId "" unlinks. */
export async function setMyMember(
  groupId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { status: "error", message: "Sign in with Google first" };
  const group = await getGroupForWrite(groupId);
  if (!group)
    return { status: "error", message: "This group no longer exists" };

  const raw = String(formData.get("memberId") ?? "");
  const memberId = raw === "" ? null : raw;
  if (memberId && !group.memberIds.includes(memberId))
    return { status: "error", message: "Pick someone from this group" };

  try {
    await db
      .insert(groupFollows)
      .values({ userId: user.id, groupId, memberId })
      .onConflictDoUpdate({
        target: [groupFollows.userId, groupFollows.groupId],
        set: { memberId, lastViewedAt: sql`now()` },
      });
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      return {
        status: "error",
        message: "Someone else already linked that person to their account",
      };
    }
    throw error;
  }
  refresh();
  return { status: "ok", at: Date.now() };
}

/** Removes the group from the account. The group itself and its data stay. */
export async function forgetGroup(groupId: string): Promise<void> {
  const user = await getSessionUser();
  if (!user || !GROUP_ID_PATTERN.test(groupId)) return;
  await db
    .delete(groupFollows)
    .where(
      and(eq(groupFollows.userId, user.id), eq(groupFollows.groupId, groupId)),
    );
  refresh();
}
