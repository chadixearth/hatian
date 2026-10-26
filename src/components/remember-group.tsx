"use client";

import { useEffect, useRef } from "react";
import { trackGroup } from "@/app/actions/account";
import { writeRecentGroup } from "@/components/recent-groups-storage";
import type { Currency } from "@/lib/types";

export function RememberGroup({
  id,
  name,
  currency,
  signedIn = false,
}: {
  id: string;
  name: string;
  currency: Currency;
  signedIn?: boolean;
}) {
  const trackedIdRef = useRef<string | null>(null);

  useEffect(() => {
    writeRecentGroup({ id, name, currency });
  }, [id, name, currency]);

  useEffect(() => {
    if (!signedIn) return;
    if (trackedIdRef.current === id) return;
    trackedIdRef.current = id;
    void trackGroup(id).catch(() => {
      // Ignore background tracking errors
    });
  }, [id, signedIn]);

  return null;
}
