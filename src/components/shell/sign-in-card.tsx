"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { HatianLogo } from "@/components/logo";
import { authClient } from "@/lib/auth/client";

const BENEFITS = [
  "Keep your groups synced across phone, tablet, and laptop automatically.",
  "Link “this is me” in each group to see your personal balance across currencies.",
  "Export all your saved groups to a multi-sheet Excel (.xlsx) workbook anytime.",
] as const;

/** Same-origin path only: rejects "//host" and "/\host", which browsers treat as another origin. */
function sanitizeNextPath(raw: string | null | undefined): string {
  if (!raw) return "/groups";
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")) {
    return raw;
  }
  return "/groups";
}

function GoogleMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-[18px] shrink-0"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z"
      />
    </svg>
  );
}

export function SignInCard() {
  const searchParams = useSearchParams();
  const next = sanitizeNextPath(searchParams.get("next"));
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = session?.user ?? null;

  async function handleGoogleSignIn() {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: next,
      });
      if (result && "error" in result && result.error) {
        setError(
          result.error.message ||
            "Could not start Google sign-in. Please try again.",
        );
        setPending(false);
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Could not start Google sign-in. Please try again.",
      );
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
      <div className="flex items-center gap-2.5">
        <HatianLogo className="size-8 shrink-0" />
        <span className="text-sm font-semibold text-muted">Hatian Account</span>
      </div>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Sign in to keep your groups everywhere
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Connect your Google account to save groups across devices, claim your
        member profile, and track everything you owe or are owed.
      </p>

      <div className="mt-6">
        {sessionPending ? (
          <div
            aria-hidden="true"
            className="h-11 w-full animate-pulse rounded-xl border border-border bg-surface-muted/70 motion-reduce:animate-none"
          />
        ) : user ? (
          <div className="space-y-3 rounded-xl border border-border bg-surface-muted/60 p-4">
            <p className="text-sm font-medium text-foreground">
              Signed in as{" "}
              <span className="font-semibold">{user.name || user.email}</span>
              {user.name && user.email ? (
                <span className="block text-xs text-muted">{user.email}</span>
              ) : null}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/groups"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span>Go to My groups</span>
                <ArrowRight
                  className="size-4"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </Link>
              {next !== "/groups" && (
                <Link
                  href={next}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Continue to page
                </Link>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={handleGoogleSignIn}
            className="inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground shadow-card transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
          >
            <GoogleMark />
            <span>
              {pending ? "Redirecting to Google…" : "Continue with Google"}
            </span>
          </button>
        )}

        <div aria-live="polite" className="mt-3 min-h-1">
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm font-medium text-danger"
            >
              {error}
            </p>
          )}
        </div>
      </div>

      <ul className="mt-6 space-y-2.5 border-t border-border pt-5">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2.5 text-sm">
            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-get-bg text-get">
              <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="text-muted">{benefit}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl border border-border bg-surface-muted/50 px-4 py-3 text-xs leading-relaxed text-muted">
        <p className="font-medium text-foreground">
          You can keep using Hatian without an account.
        </p>
        <p className="mt-0.5">
          Anyone with a group link can add expenses and settle up—no sign-in
          required.{" "}
          <Link
            href="/"
            className="font-semibold text-accent underline underline-offset-2 hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
