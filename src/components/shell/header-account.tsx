"use client";

import { ChevronDown, LogIn, LogOut, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AccountSync } from "@/components/shell/account-sync";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { authClient } from "@/lib/auth/client";

/** Right side of the site header: sign-in button, or My groups + account menu. */
export function HeaderAccount() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session?.user ?? null;
  const userImage = user?.image ?? null;

  useEffect(() => {
    if (!userImage) {
      setImgFailed(false);
    }
  }, [userImage]);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      window.location.assign("/");
    }
  }

  const nextTarget =
    pathname && pathname !== "/sign-in" && pathname.startsWith("/")
      ? pathname
      : "/groups";
  const signInHref = `/sign-in?next=${encodeURIComponent(nextTarget)}`;

  const displayName = user?.name?.trim() || user?.email || "Account";

  return (
    <div className="flex items-center gap-2">
      <AccountSync />
      {isPending ? (
        <div
          aria-hidden="true"
          className="h-11 w-28 animate-pulse rounded-xl border border-border bg-surface-muted/70 motion-reduce:animate-none"
        />
      ) : user ? (
        <>
          <Link
            href="/groups"
            aria-current={pathname === "/groups" ? "page" : undefined}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              pathname === "/groups"
                ? "bg-surface-muted text-foreground"
                : "text-foreground hover:bg-surface-muted"
            }`}
          >
            <Users
              className="size-4 text-accent"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>My groups</span>
          </Link>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {user.image && !imgFailed ? (
                // biome-ignore lint/performance/noImgElement: external Google profile photo URL
                <img
                  src={user.image}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="size-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <MemberAvatar name={displayName} index={0} size="sm" />
              )}
              <span className="hidden max-w-32 truncate sm:inline">
                {displayName}
              </span>
              <ChevronDown
                className={`size-4 text-muted transition-transform duration-150 motion-reduce:transition-none ${
                  menuOpen ? "rotate-180" : ""
                }`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                aria-label="Account options"
                className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-border bg-surface p-2 shadow-card"
              >
                <div className="border-b border-border px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {user.name || "Signed in"}
                  </p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>

                <div className="mt-1 space-y-1">
                  <Link
                    href="/groups"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <Users
                      className="size-4 text-muted"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span>My groups</span>
                  </Link>

                  <button
                    type="button"
                    role="menuitem"
                    disabled={signingOut}
                    onClick={handleSignOut}
                    className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-danger-bg hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
                  >
                    <LogOut
                      className="size-4 shrink-0"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span>{signingOut ? "Signing out…" : "Sign out"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <Link
          href={signInHref}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <LogIn
            className="size-4 text-accent"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>Sign in</span>
        </Link>
      )}
    </div>
  );
}
