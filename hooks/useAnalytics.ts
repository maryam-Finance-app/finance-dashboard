"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/client";
import type { TransactionType } from "@/hooks/useTransactions";

export type AnalyticsRow = {
  type: TransactionType;
  amount: number;
  date: string; // "YYYY-MM-DD"
  category: { name: string } | null; // null for savings
};

const CHUNK = 1000; // Supabase returns at most 1000 rows per request

export function useAnalyticsData() {
  return useQuery({
    queryKey: ["transactions", "analytics"],
    queryFn: async (): Promise<AnalyticsRow[]> => {
      const supabase = createClient();
      const rows: AnalyticsRow[] = [];

      for (let from = 0; ; from += CHUNK) {
        const { data, error } = await supabase
          .from("transactions")
          .select("type, amount, date, category:categories ( name )")
          .order("date", { ascending: true })
          .order("id", { ascending: true })
          .range(from, from + CHUNK - 1);

        // "Range not satisfiable": we asked past the last row, so we're done
        if (error?.code === "PGRST103") break;
        if (error) throw error;

        rows.push(...((data ?? []) as unknown as AnalyticsRow[]));
        if (!data || data.length < CHUNK) break;
      }

      return rows;
    },
  });
}