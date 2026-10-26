import { CURRENCIES, type Currency } from "@/lib/types";

export const RECENT_GROUPS_KEY = "hatian:recent";
const MAX_RECENT_GROUPS = 8;

export type RecentGroup = {
  id: string;
  name: string;
  currency: Currency;
  visitedAt: string | number;
};

function isCurrency(value: unknown): value is Currency {
  return (
    typeof value === "string" &&
    (CURRENCIES as readonly string[]).includes(value)
  );
}

export function readRecentGroups(): RecentGroup[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_GROUPS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid: RecentGroup[] = [];
    const seen = new Set<string>();
    for (const item of parsed) {
      if (
        item &&
        typeof item === "object" &&
        "id" in item &&
        typeof item.id === "string" &&
        item.id.length > 0 &&
        "name" in item &&
        typeof item.name === "string" &&
        "currency" in item &&
        isCurrency(item.currency) &&
        !seen.has(item.id)
      ) {
        seen.add(item.id);
        const visitedAt =
          "visitedAt" in item &&
          (typeof item.visitedAt === "string" ||
            typeof item.visitedAt === "number")
            ? item.visitedAt
            : new Date().toISOString();
        valid.push({
          id: item.id,
          name: item.name,
          currency: item.currency,
          visitedAt,
        });
      }
      if (valid.length >= MAX_RECENT_GROUPS) break;
    }
    return valid;
  } catch {
    return [];
  }
}

export function writeRecentGroup(entry: {
  id: string;
  name: string;
  currency: Currency;
}): void {
  if (typeof window === "undefined") return;
  try {
    const existing = readRecentGroups().filter((g) => g.id !== entry.id);
    const updated: RecentGroup[] = [
      {
        id: entry.id,
        name: entry.name,
        currency: entry.currency,
        visitedAt: new Date().toISOString(),
      },
      ...existing,
    ].slice(0, MAX_RECENT_GROUPS);
    window.localStorage.setItem(RECENT_GROUPS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota or private-browsing errors
  }
}

export function removeRecentGroup(id: string): RecentGroup[] {
  if (typeof window === "undefined") return [];
  try {
    const updated = readRecentGroups().filter((g) => g.id !== id);
    window.localStorage.setItem(RECENT_GROUPS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
