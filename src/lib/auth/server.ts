import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const secret = process.env.NEON_AUTH_COOKIE_SECRET;
if (!baseUrl || !secret)
  throw new Error("NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET must be set");

// Managed Better Auth (Neon Auth). Users and sessions live in the `neon_auth` schema
// of the same database; the browser talks to it through /api/auth/*.
export const auth = createNeonAuth({ baseUrl, cookies: { secret } });
