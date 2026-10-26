import Link from "next/link";
import { Suspense } from "react";
import { HatianLogo } from "@/components/logo";
import { HeaderAccount } from "@/components/shell/header-account";

/**
 * Static header shell (prerendered on every page). The account controls read the
 * current path, so they stream in behind Suspense as cacheComponents requires.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2.5 rounded-xl px-1.5 text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <HatianLogo className="size-8 shrink-0" />
          <span className="text-lg font-semibold tracking-tight">Hatian</span>
        </Link>
        <Suspense
          fallback={
            <div
              aria-hidden="true"
              className="h-11 w-28 animate-pulse rounded-xl border border-border bg-surface-muted/70 motion-reduce:animate-none"
            />
          }
        >
          <HeaderAccount />
        </Suspense>
      </div>
    </header>
  );
}
