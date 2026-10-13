"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { createClient } from "@/lib/client";

export type TransactionType = "income" | "expense" | "savings";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // "YYYY-MM-DD"
  note: string | null;
  category: { id: string; name: string } | null; // null for savings
  goal: { id: string; title: string } | null; // null for income/expense
};

export type TransactionFilters = {
  type?: TransactionType;
  from?: string; // "YYYY-MM-DD", inclusive
  to?: string; // "YYYY-MM-DD", inclusive
  page?: number; // 0-based
  pageSize?: number;
};

export function useTransactions(filters: TransactionFilters = {}) {
  const { type, from, to, page = 0, pageSize = 20 } = filters;

  return useQuery({
    queryKey: ["transactions", { type, from, to, page, pageSize }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const supabase = createClient();

      let query = supabase
        .from("transactions")
        .select(
          `
          id, type, amount, date, note,
          category:categories ( id, name ),
          goal:goals ( id, title )
        `,
          { count: "exact" }
        )
        // No .eq("user_id", ...) needed: the RLS policy already limits
        // this table to the logged-in user's rows.
        .order("date", { ascending: false })
        .order("id", { ascending: false }) 
        .range(page * pageSize, page * pageSize + pageSize - 1);

      if (type) query = query.eq("type", type);
      if (from) query = query.gte("date", from);
      if (to) query = query.lte("date", to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        transactions: (data ?? []) as unknown as Transaction[],
        total: count ?? 0,
      };
    },
  });
}