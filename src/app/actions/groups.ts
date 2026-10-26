"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, pgErrorCode } from "@/db";
import { groupFollows, groups, members } from "@/db/schema";
import { getSessionUser } from "@/lib/account";
import { getGroupForWrite } from "@/lib/data";
import { newGroupId } from "@/lib/ids";
import { type ActionState, CURRENCIES } from "@/lib/types";

const memberName = z
  .string()
  .trim()
  .min(1, "Names can't be empty")
  .max(30, "Keep names under 30 characters");

const createGroupInput = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the group a name")
    .max(60, "Keep the group name under 60 characters"),
  currency: z.enum(CURRENCIES, "Pick a currency"),
  members: z
    .array(z.string().trim())
    .transform((names) => names.filter(Boolean))
    .pipe(
      z
        .array(memberName)
        .min(2, "Add at least two people")
        .max(30, "A group can have up to 30 people")
        .refine(
          (names) =>
            new Set(names.map((n) => n.toLowerCase())).size === names.length,
          "Each person needs a different name",
        ),
    ),
});

export async function createGroup(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createGroupInput.safeParse({
    name: formData.get("name"),
    currency: formData.get("currency"),
    members: formData.getAll("member"),
  });
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0].message };

  const id = newGroupId();
  const { name, currency } = parsed.data;
  const user = await getSessionUser();
  const groupInsert = db.insert(groups).values({ id, name, currency });
  const memberInsert = db.insert(members).values(
    parsed.data.members.map((memberName) => ({
      groupId: id,
      name: memberName,
    })),
  );
  // Signed-in creators get the group saved to their account in the same transaction.
  if (user) {
    await db.batch([
      groupInsert,
      memberInsert,
      db.insert(groupFollows).values({ userId: user.id, groupId: id }),
    ]);
  } else {
    await db.batch([groupInsert, memberInsert]);
  }
  redirect(`/g/${id}`);
}

export async function addMember(
  groupId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = memberName.safeParse(formData.get("name") ?? "");
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0].message };

  const group = await getGroupForWrite(groupId);
  if (!group)
    return { status: "error", message: "This group no longer exists" };
  if (group.memberIds.length >= 30)
    return { status: "error", message: "A group can have up to 30 people" };

  try {
    await db.insert(members).values({ groupId, name: parsed.data });
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      return {
        status: "error",
        message: `${parsed.data} is already in this group`,
      };
    }
    throw error;
  }
  refresh();
  return { status: "ok", at: Date.now() };
}
