"use client";

import { ArrowRight, Check, LogIn } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { setMyMember } from "@/app/actions/account";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { formatMoney } from "@/lib/money";
import {
  type Balance,
  type Currency,
  type GroupViewer,
  IDLE,
  type Member,
  type Transfer,
} from "@/lib/types";

export function PersonalCard({
  groupId,
  currency,
  members,
  balances,
  transfers,
  viewer,
}: {
  groupId: string;
  currency: Currency;
  members: Member[];
  balances: Balance[];
  transfers: Transfer[];
  viewer: GroupViewer;
}) {
  const boundSetMyMember = setMyMember.bind(null, groupId);
  const [state, formAction, pending] = useActionState(boundSetMyMember, IDLE);

  if (!viewer.user) {
    return (
      <section
        aria-label="Account sync"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-card sm:px-5"
      >
        <p className="text-sm text-muted">
          Sign in with Google to keep this group in your account and export all
          your groups
        </p>
        <Link
          href={`/sign-in?next=/g/${groupId}`}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <LogIn
            className="size-4 text-accent"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>Sign in</span>
        </Link>
      </section>
    );
  }

  const memberIndexMap = new Map(members.map((m, idx) => [m.id, idx]));
  const memberNameMap = new Map(members.map((m) => [m.id, m.name]));

  // Signed in, but not yet linked to a group member
  if (!viewer.memberId) {
    const claimedSet = new Set(viewer.claimedMemberIds);

    return (
      <section
        aria-labelledby="which-member-heading"
        className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
      >
        <div className="space-y-1">
          <h2
            id="which-member-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            Which one are you?
          </h2>
          <p className="text-sm text-muted">
            Link your name in this group to see your personal balance and share
            summary.
          </p>
        </div>

        <form action={formAction} className="mt-4">
          <div className="flex flex-wrap gap-2">
            {members.map((member, index) => {
              const isClaimed = claimedSet.has(member.id);
              return (
                <button
                  key={member.id}
                  type="submit"
                  name="memberId"
                  value={member.id}
                  disabled={isClaimed || pending}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-accent hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <MemberAvatar name={member.name} index={index} size="xs" />
                  <span>{member.name}</span>
                  {isClaimed && (
                    <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-muted">
                      linked
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div aria-live="polite" className="mt-2 min-h-1">
            {state.status === "error" && (
              <p
                role="alert"
                className="rounded-xl border border-danger/30 bg-danger-bg px-3.5 py-2 text-xs font-medium text-danger"
              >
                {state.message}
              </p>
            )}
          </div>
        </form>
      </section>
    );
  }

  // Signed in and linked to a member
  const myId = viewer.memberId;
  const myIndex = memberIndexMap.get(myId) ?? 0;
  const myName = memberNameMap.get(myId) ?? "You";
  const myBalance = balances.find((b) => b.memberId === myId);
  const netMinor = myBalance?.netMinor ?? 0;
  const myTransfers = transfers.filter((t) => t.from === myId || t.to === myId);

  return (
    <section
      aria-labelledby="personal-summary-heading"
      className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <MemberAvatar name={myName} index={myIndex} size="xs" />
            <span
              id="personal-summary-heading"
              className="text-xs font-medium text-muted"
            >
              Linked as{" "}
              <strong className="font-semibold text-foreground">
                {myName}
              </strong>
            </span>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
              You
            </span>
          </div>

          {netMinor < 0 ? (
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-owe sm:text-3xl">
              You owe {formatMoney(Math.abs(netMinor), currency)}
            </p>
          ) : netMinor > 0 ? (
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-get sm:text-3xl">
              You get back {formatMoney(netMinor, currency)}
            </p>
          ) : (
            <p className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight text-get sm:text-3xl">
              <Check
                className="size-5 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>You&apos;re all square</span>
            </p>
          )}
        </div>

        <form action={formAction}>
          <input type="hidden" name="memberId" value="" />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-50"
          >
            {pending ? "Unlinking…" : "Not you?"}
          </button>
        </form>
      </div>

      {myTransfers.length > 0 && (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-background">
          {myTransfers.map((t) => {
            const isPaying = t.from === myId;
            const fromName = memberNameMap.get(t.from) ?? "Unknown";
            const toName = memberNameMap.get(t.to) ?? "Unknown";
            const fromIdx = memberIndexMap.get(t.from) ?? 0;
            const toIdx = memberIndexMap.get(t.to) ?? 0;
            const formatted = formatMoney(t.amountMinor, currency);

            return (
              <li
                key={`my-${t.from}-${t.to}`}
                className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <MemberAvatar name={fromName} index={fromIdx} size="xs" />
                  <ArrowRight
                    className="size-4 shrink-0 text-muted"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <MemberAvatar name={toName} index={toIdx} size="xs" />
                  <span className="text-foreground">
                    {isPaying ? (
                      <>
                        <span className="font-semibold">You</span> pay{" "}
                        <span className="font-semibold">{toName}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">{fromName}</span> pays{" "}
                        <span className="font-semibold">you</span>
                      </>
                    )}
                  </span>
                </div>

                <span
                  className={`text-sm font-semibold tabular-nums ${
                    isPaying ? "text-owe" : "text-get"
                  }`}
                >
                  {formatted}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div aria-live="polite" className="min-h-1">
        {state.status === "error" && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-danger/30 bg-danger-bg px-3.5 py-2 text-xs font-medium text-danger"
          >
            {state.message}
          </p>
        )}
      </div>
    </section>
  );
}
