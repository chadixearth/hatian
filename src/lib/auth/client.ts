"use client";

import { createAuthClient } from "@neondatabase/auth/next";

/** Better Auth React client; talks to the same-origin /api/auth proxy. */
export const authClient = createAuthClient();
