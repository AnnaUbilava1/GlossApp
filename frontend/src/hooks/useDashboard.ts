import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../utils/api";

export type DashboardRecord = {
  id: string;
  licenseNumber: string;
  carType: string;
  companyDiscount?: string;
  serviceType: string;
  price: number;
  boxNumber: number;
  washerName: string;
  startTime: string | Date;
  endTime?: string | Date | null;
  isFinished: boolean;
  isPaid: boolean;
  paymentMethod?: "cash" | "card" | null;
};

function todayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function useDashboard(token: string | null) {
  const [records, setRecords] = useState<DashboardRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("2026-01-01");
  const [endDate, setEndDate] = useState<string>(todayDateString());
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!token) {
      setRecords([]);
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const path =
      params.toString().length > 0
        ? `/api/records?${params.toString()}`
        : "/api/records";

    apiFetch<{ records: DashboardRecord[] }>(path, { token })
      .then((data) => {
        setRecords(data.records || []);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load records")
      )
      .finally(() => setLoading(false));
  }, [token, startDate, endDate, refreshKey]);

  const summary = useMemo(() => {
    let cash = 0;
    let card = 0;
    for (const r of records) {
      if (!r.isPaid) continue;
      if (r.paymentMethod === "cash") cash += r.price;
      else if (r.paymentMethod === "card") card += r.price;
      else cash += r.price; // fallback if method missing
    }
    return {
      cash,
      card,
      total: cash + card,
    };
  }, [records]);

  return {
    records,
    loading,
    error,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    summary,
    refresh,
  };
}

