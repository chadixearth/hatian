import { CreateGroupForm } from "@/components/create-group-form";
import { HatianLogo } from "@/components/logo";
import { RecentGroups } from "@/components/recent-groups";

const STEPS = [
  {
    step: "01",
    title: "Create a group",
    body: "Add your barkada, housemates, or travel crew. No accounts, passwords, or app downloads.",
  },
  {
    step: "02",
    title: "Share the link & log expenses",
    body: "Drop the link in your group chat. Anyone can log receipts—split equally, by exact amount, or by shares.",
  },
  {
    step: "03",
    title: "Settle up in fewest transfers",
    body: "Hatian nets out everyone’s tab and shows the minimum payments needed so everybody is square.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <HatianLogo className="h-8 w-8 shrink-0" />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Hatian
          </span>
        </div>
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
          No sign-up · Free · Share by link
        </span>
      </header>

      <main className="mt-8 flex-1 space-y-8 sm:mt-10 sm:space-y-10">
        <section className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Split shared bills without the spreadsheet headache.
          </h1>
          <p className="text-sm leading-relaxed text-muted sm:text-base">
            Who paid for the Grab? Who owes for the Airbnb? Hatian keeps score
            and tells everyone the fewest payments to settle up.
          </p>
        </section>

        <section aria-labelledby="start-group-heading" className="space-y-3">
          <h2
            id="start-group-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            Start a new group
          </h2>
          <CreateGroupForm />
        </section>

        <RecentGroups />

        <section
          aria-labelledby="how-it-works-heading"
          className="space-y-3 pt-2"
        >
          <h2
            id="how-it-works-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            How it works
          </h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((item) => (
              <li
                key={item.step}
                className="rounded-[14px] border border-border bg-surface p-4"
              >
                <span className="font-mono text-xs font-semibold text-accent">
                  {item.step}
                </span>
                <h3 className="mt-1.5 text-sm font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="mt-12 border-t border-border pt-6 text-xs text-muted">
        <p>
          Hatian — built for trips, boarding-house bills, group dinners, and
          pasalubong runs. Bookmark or share your group link to come back
          anytime.
        </p>
      </footer>
    </div>
  );
}
