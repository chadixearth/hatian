import {
  ArrowRight,
  Check,
  FileSpreadsheet,
  HandCoins,
  Plus,
  Receipt,
  Share2,
  Users,
} from "lucide-react";
import { CreateGroupForm } from "@/components/create-group-form";
import { RecentGroups } from "@/components/recent-groups";
import { HeroAccountCta } from "@/components/shell/hero-account-cta";
import { MemberAvatar } from "@/components/ui/member-avatar";

const FEATURES = [
  {
    icon: Share2,
    title: "No sign-up needed",
    body: "Start a group in seconds and drop the link in your group chat. Anyone with the link can log expenses right away.",
  },
  {
    icon: HandCoins,
    title: "Fewest payments",
    body: "Hatian nets out everyone’s tab automatically so your barkada settles up with the minimum number of transfers.",
  },
  {
    icon: FileSpreadsheet,
    title: "Excel export",
    body: "Download a clean .xlsx workbook for any group—or export all your saved groups at once—for full transparency.",
  },
  {
    icon: Users,
    title: "Google sign-in keeps groups across devices",
    body: "Optionally sign in to save groups between phone and laptop, link yourself as a member, and see total balances.",
  },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 py-8 sm:gap-16 sm:px-6 sm:py-12">
      {/* Hero + Static Product Preview */}
      <section className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-6 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted shadow-card">
            <Receipt
              className="size-3.5 text-accent"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Made for barkadas, housemates, and group trips</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Split shared bills without the spreadsheet headache.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Who paid for the Grab? Who owes for the Siargao villa? Create a
              group, share one link in the chat, log receipts by equal, exact,
              or share splits, and settle up in the fewest payments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#create-group"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />
              <span>Start a group</span>
            </a>

            <HeroAccountCta />
          </div>
        </div>

        {/* Decorative Product Preview Card */}
        <div
          aria-hidden="true"
          className="rounded-2xl border border-border bg-surface p-5 shadow-card lg:col-span-5"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Siargao Barkada Trip
                </span>
                <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted">
                  PHP
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                4 members · 6 expenses logged
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted">Total spent</p>
              <p className="text-sm font-semibold tracking-tight text-foreground tabular-nums">
                ₱18,400.00
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <HandCoins
                  className="size-3.5 text-accent"
                  strokeWidth={1.75}
                />
                <span>Settle up · Fewest payments</span>
              </span>
              <span className="text-[11px] text-muted">1 transfer left</span>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-3">
              <div className="flex min-w-0 items-center gap-2">
                <MemberAvatar name="Ben" index={1} size="sm" />
                <span className="truncate text-xs font-medium text-foreground">
                  Ben pays Ana
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-muted" />
                <MemberAvatar name="Ana" index={0} size="sm" />
              </div>
              <span className="shrink-0 text-sm font-semibold tracking-tight text-foreground tabular-nums">
                ₱2,750
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <span className="block text-xs font-semibold text-foreground">
              Member balances
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-get-border bg-get-bg px-2.5 py-1 text-xs font-medium text-get tabular-nums">
                <MemberAvatar name="Ana" index={0} size="xs" />
                <span>Ana gets back ₱2,750</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-owe-border bg-owe-bg px-2.5 py-1 text-xs font-medium text-owe tabular-nums">
                <MemberAvatar name="Ben" index={1} size="xs" />
                <span>Ben owes ₱2,750</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted tabular-nums">
                <MemberAvatar name="Carlo" index={2} size="xs" />
                <Check className="size-3 text-accent" strokeWidth={2} />
                <span>Carlo settled</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent groups + Create Group Form */}
      <div className="grid items-start gap-8 lg:grid-cols-12">
        <section
          id="create-group"
          aria-labelledby="start-group-heading"
          className="scroll-mt-20 space-y-3 lg:col-span-7"
        >
          <div>
            <h2
              id="start-group-heading"
              className="text-base font-semibold tracking-tight text-foreground"
            >
              Start a new group
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Add at least two people now—you can always add more members later.
            </p>
          </div>
          <CreateGroupForm />
        </section>

        <div className="space-y-6 lg:col-span-5">
          <RecentGroups />

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground">
              How Hatian works
            </h3>
            <ol className="mt-3 space-y-3 text-sm text-muted">
              <li className="flex gap-3">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-accent tabular-nums">
                  1
                </span>
                <span>
                  <strong className="font-medium text-foreground">
                    Create your group
                  </strong>{" "}
                  and pick a currency (PHP, JPY, USD, and 12 more).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-accent tabular-nums">
                  2
                </span>
                <span>
                  <strong className="font-medium text-foreground">
                    Share the link
                  </strong>{" "}
                  so anyone in your barkada can log expenses or repayments.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-accent tabular-nums">
                  3
                </span>
                <span>
                  <strong className="font-medium text-foreground">
                    Settle up cleanly
                  </strong>{" "}
                  with one-tap “Mark as paid” or export everything to Excel.
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* 4-Feature Strip */}
      <section aria-labelledby="features-heading" className="space-y-4">
        <div className="space-y-1">
          <h2
            id="features-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            Everything you need to split fairly
          </h2>
          <p className="text-sm text-muted">
            Fast on mobile, transparent with math, and ready when you want
            account sync.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-card"
              >
                <div className="space-y-3">
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-surface-muted text-accent">
                    <Icon
                      className="size-[18px]"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted">
                    {feature.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
