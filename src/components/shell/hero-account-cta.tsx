"use client";

import { LogIn, Users } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";

const CLASS =
  "inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Secondary hero button: "Sign in with Google", or "My groups" once signed in. */
export function HeroAccountCta() {
  const { data: session } = authClient.useSession();
  if (session?.user) {
    return (
      <Link href="/groups" className={CLASS}>
        <Users
          className="size-4 text-accent"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <span>My groups</span>
      </Link>
    );
  }
  return (
    <Link href="/sign-in?next=/groups" className={CLASS}>
      <LogIn
        className="size-4 text-accent"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <span>Sign in with Google</span>
    </Link>
  );
}
