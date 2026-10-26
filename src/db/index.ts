import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// Neon's HTTP driver: one fetch per query (or per db.batch, which runs as a single
// transaction), no connection pool to manage in serverless functions.
export const db = drizzle({ client: neon(url), schema, casing: "snake_case" });

/** Postgres SQLSTATE of a failed query, unwrapping DrizzleQueryError causes. */
export function pgErrorCode(error: unknown): string | undefined {
  let e = error;
  while (e && typeof e === "object") {
    if ("code" in e && typeof e.code === "string") return e.code;
    e = "cause" in e ? e.cause : undefined;
  }
  return undefined;
}
