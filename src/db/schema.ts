import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Column names are snake_cased by `casing: "snake_case"` (db client + drizzle.config.ts).
// Money columns are integer minor units. ids default to Postgres 18 `uuidv7()`, which is
// time-ordered, so ORDER BY id is insertion order.

const createdAt = () =>
  timestamp({ withTimezone: true }).notNull().defaultNow();
const money = () => bigint({ mode: "number" }).notNull();

export const splitMode = pgEnum("split_mode", ["equal", "exact", "shares"]);

export const groups = pgTable("groups", {
  /** Random 12-char base62 capability id; knowing it grants access to the group. */
  id: text().primaryKey(),
  name: text().notNull(),
  currency: text().notNull().default("PHP"),
  createdAt: createdAt(),
});

export const members = pgTable(
  "members",
  {
    id: uuid().primaryKey().default(sql`uuidv7()`),
    groupId: text()
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    name: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("members_group_name_uq").on(t.groupId, sql`lower(${t.name})`),
    // Target for composite FKs that keep expenses/settlements inside one group.
    unique("members_group_id_uq").on(t.groupId, t.id),
  ],
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid().primaryKey().default(sql`uuidv7()`),
    groupId: text()
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    description: text().notNull(),
    amountMinor: money(),
    paidBy: uuid().notNull(),
    spentOn: date({ mode: "string" }).notNull().defaultNow(),
    splitMode: splitMode().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "expenses_payer_fk",
      columns: [t.groupId, t.paidBy],
      foreignColumns: [members.groupId, members.id],
    }),
    index("expenses_group_idx").on(t.groupId, t.spentOn.desc(), t.id.desc()),
    check("expenses_amount_positive", sql`${t.amountMinor} > 0`),
  ],
);

export const expenseShares = pgTable(
  "expense_shares",
  {
    expenseId: uuid()
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    memberId: uuid()
      .notNull()
      .references(() => members.id),
    amountMinor: money(),
    /** Weight when the expense was split by shares; null otherwise. */
    weight: integer(),
  },
  (t) => [
    primaryKey({ columns: [t.expenseId, t.memberId] }),
    check("expense_shares_amount_nonneg", sql`${t.amountMinor} >= 0`),
  ],
);

export const settlements = pgTable(
  "settlements",
  {
    id: uuid().primaryKey().default(sql`uuidv7()`),
    groupId: text()
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    fromMember: uuid().notNull(),
    toMember: uuid().notNull(),
    amountMinor: money(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "settlements_from_fk",
      columns: [t.groupId, t.fromMember],
      foreignColumns: [members.groupId, members.id],
    }),
    foreignKey({
      name: "settlements_to_fk",
      columns: [t.groupId, t.toMember],
      foreignColumns: [members.groupId, members.id],
    }),
    index("settlements_group_idx").on(t.groupId, t.id.desc()),
    check("settlements_amount_positive", sql`${t.amountMinor} > 0`),
    check(
      "settlements_distinct_members",
      sql`${t.fromMember} <> ${t.toMember}`,
    ),
  ],
);

/**
 * Groups saved to a signed-in account. user_id is a Neon Auth user (neon_auth."user".id);
 * the FK to that table is added in SQL (drizzle/0001) because drizzle-kit only manages `public`.
 * member_id is the account's own member in the group ("this is me"); one account per member.
 */
export const groupFollows = pgTable(
  "group_follows",
  {
    userId: uuid().notNull(),
    groupId: text()
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    memberId: uuid(),
    createdAt: createdAt(),
    lastViewedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.groupId] }),
    foreignKey({
      name: "group_follows_member_fk",
      columns: [t.groupId, t.memberId],
      foreignColumns: [members.groupId, members.id],
    }),
    uniqueIndex("group_follows_member_uq").on(t.groupId, t.memberId),
    index("group_follows_user_idx").on(t.userId, t.lastViewedAt.desc()),
  ],
);
