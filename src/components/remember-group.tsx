"use client";

import { useEffect } from "react";
import { writeRecentGroup } from "@/components/recent-groups-storage";
import type { Currency } from "@/lib/types";

export function RememberGroup({
  id,
  name,
  currency,
}: {
  id: string;
  name: string;
  currency: Currency;
}) {
  useEffect(() => {
    writeRecentGroup({ id, name, currency });
  }, [id, name, currency]);

  return null;
}
