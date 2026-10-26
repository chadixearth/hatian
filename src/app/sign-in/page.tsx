import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInCard } from "@/components/shell/sign-in-card";

export const metadata: Metadata = {
  title: "Sign in",
};

function SignInCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8"
    >
      <div className="h-8 w-36 animate-pulse rounded-lg bg-surface-muted motion-reduce:animate-none" />
      <div className="mt-4 h-8 w-3/4 animate-pulse rounded-lg bg-surface-muted motion-reduce:animate-none" />
      <div className="mt-2 h-10 w-full animate-pulse rounded-lg bg-surface-muted/70 motion-reduce:animate-none" />
      <div className="mt-6 h-11 w-full animate-pulse rounded-xl bg-surface-muted motion-reduce:animate-none" />
      <div className="mt-6 space-y-2.5 border-t border-border pt-5">
        <div className="h-4 w-full animate-pulse rounded bg-surface-muted/70 motion-reduce:animate-none" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-surface-muted/70 motion-reduce:animate-none" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-surface-muted/70 motion-reduce:animate-none" />
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      <Suspense fallback={<SignInCardSkeleton />}>
        <SignInCard />
      </Suspense>
    </main>
  );
}
