"use client";

import { useCallback, useEffect, useState } from "react";
import { listCanteenOrders, watchCanteenOrders } from "@/lib/db/canteen";
import type { OrderRow, OrderStatusValue } from "@/lib/types/campus";
import { useLiveRefresh } from "@/components/layout/live-sync";

/** Orders of one canteen in the given statuses, kept current by realtime changes plus a slow poll. */
export function useCanteenOrders(canteenId: string, statuses: OrderStatusValue[]) {
  const [orders, setOrders] = useState<OrderRow[]>();
  const [error, setError] = useState<string>();
  const key = statuses.join(",");

  const reload = useCallback(async () => {
    try { setOrders(await listCanteenOrders(canteenId, key.split(",") as OrderStatusValue[])); setError(undefined); }
    catch { setError("Orders could not be loaded. Check your connection and try again."); }
  }, [canteenId, key]);

  useEffect(() => {
    const first = setTimeout(() => void reload(), 0);
    const stop = watchCanteenOrders(canteenId, () => void reload());
    const poll = setInterval(() => void reload(), 30_000);
    return () => { clearTimeout(first); clearInterval(poll); stop(); };
  }, [canteenId, reload]);

  useLiveRefresh(reload);
  return { orders, error, reload };
}
