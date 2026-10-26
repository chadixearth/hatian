import "server-only";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";
import { db } from "@/db";
import { groupFollows } from "@/db/schema";
import { auth } from "./auth/server";
import { getGroupViews } from "./data";
import { GROUP_ID_PATTERN } from "./ids";
import type {
  CurrencyTotal,
  GroupView,
  GroupViewer,
  MyGroup,
  MyGroupsView,
  SessionUser,
} from "./types";

/** The signed-in Google account, or null. Reads cookies, so call it inside <Suspense>. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Stop prerendering here instead of inside the auth SDK, whose internal cookies()
  // call otherwise rejects (and logs) when the static shell finishes.
  await connection();
  const { data } = await auth.getSession();
  const user = data?.user;
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
  };
});

/** Who is viewing a group, and which members are already linked to accounts. */
export async function getGroupViewer(groupId: string): Promise<GroupViewer> {
  const user = await getSessionUser();
  if (!GROUP_ID_PATTERN.test(groupId))
    return { user, memberId: null, claimedMemberIds: [] };

  const links = await db
    .select({ userId: groupFollows.userId, memberId: groupFollows.memberId })
    .from(groupFollows)
    .where(
      and(eq(groupFollows.groupId, groupId), isNotNull(groupFollows.memberId)),
    );

  let memberId: string | null = null;
  const claimedMemberIds: string[] = [];
  for (const link of links) {
    if (!link.memberId) continue;
    if (link.userId === user?.id) memberId = link.memberId;
    else claimedMemberIds.push(link.memberId);
  }
  return { user, memberId, claimedMemberIds };
}

type Follow = { groupId: string; memberId: string | null; lastViewedAt: Date };

/** Groups saved to the account with full ledgers, most recently viewed first. */
export async function getFollowedGroups(
  userId: string,
): Promise<{ follow: Follow; view: GroupView }[]> {
  const follows = await db
    .select({
      groupId: groupFollows.groupId,
      memberId: groupFollows.memberId,
      lastViewedAt: groupFollows.lastViewedAt,
    })
    .from(groupFollows)
    .where(eq(groupFollows.userId, userId))
    .orderBy(desc(groupFollows.lastViewedAt));
  const views = new Map(
    (await getGroupViews(follows.map((f) => f.groupId))).map((v) => [v.id, v]),
  );
  return follows.flatMap((follow) => {
    const view = views.get(follow.groupId);
    return view ? [{ follow, view }] : [];
  });
}

/** Account overview for /groups; null when signed out. */
export async function getMyGroups(): Promise<MyGroupsView | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const totals = new Map<string, CurrencyTotal>();
  const groups: MyGroup[] = (await getFollowedGroups(user.id)).map(
    ({ follow, view }) => {
      const me = follow.memberId
        ? view.members.find((m) => m.id === follow.memberId)
        : undefined;
      const myNetMinor = me
        ? (view.balances.find((b) => b.memberId === me.id)?.netMinor ?? 0)
        : null;
      if (myNetMinor !== null) {
        const total = totals.get(view.currency) ?? {
          currency: view.currency,
          owedToMeMinor: 0,
          iOweMinor: 0,
        };
        if (myNetMinor > 0) total.owedToMeMinor += myNetMinor;
        else total.iOweMinor -= myNetMinor;
        totals.set(view.currency, total);
      }
      const activity = [...view.expenses, ...view.settlements]
        .map((item) => item.createdAt)
        .sort();
      return {
        id: view.id,
        name: view.name,
        currency: view.currency,
        memberCount: view.members.length,
        expenseCount: view.expenses.length,
        totalSpentMinor: view.totalSpentMinor,
        myMemberId: me?.id ?? null,
        myMemberName: me?.name ?? null,
        myNetMinor,
        lastActivityAt: activity.at(-1) ?? null,
        lastViewedAt: follow.lastViewedAt.toISOString(),
      };
    },
  );

  return {
    user,
    groups,
    totals: [...totals.values()].sort((a, b) =>
      a.currency.localeCompare(b.currency),
    ),
  };
}
