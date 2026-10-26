"use client";

import { useEffect } from "react";
import { importRecentGroups } from "@/app/actions/account";
import { readRecentGroups } from "@/components/recent-groups-storage";
import { authClient } from "@/lib/auth/client";

export function AccountSync() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    const syncKey = `hatian:synced:${userId}`;
    try {
      if (window.localStorage.getItem(syncKey)) return;
      const groupIds = readRecentGroups().map((g) => g.id);
      importRecentGroups(groupIds)
        .then(() => {
          try {
            window.localStorage.setItem(syncKey, "1");
          } catch {
            // Ignore storage write errors
          }
        })
        .catch(() => {
          // Ignore transient sync errors; will retry on next load
        });
    } catch {
      // Ignore storage access errors
    }
  }, [userId]);

  return null;
}
