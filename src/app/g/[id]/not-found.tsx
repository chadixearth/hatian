import Link from "next/link";
import { HatianLogo } from "@/components/logo";

export default function GroupNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16 text-center sm:px-6">
      <div className="rounded-[14px] border border-border bg-surface p-6 shadow-2xs sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center">
          <HatianLogo className="h-10 w-10" />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          Group not found — check the link
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          We couldn’t find a group at this address. Double-check the URL shared
          in your chat, or start a new group below.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Back to Hatian home
          </Link>
        </div>
      </div>
    </main>
  );
}
