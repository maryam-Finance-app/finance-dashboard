"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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

/** What gets written to the database (user_id is added by the create hook). */
export type TransactionInput = {
  type: TransactionType;
  amount: number;
  date: string;
  note: string | null;
  category_id: string | null; // set for income/expense, null for savings
  goal_id: string | null; // set for savings, null for income/expense
};


export const TRANSACTIONS_PAGE_SIZE = 8;

export function useTransactions(filters: TransactionFilters = {}) {
  const { type, from, to, page = 0, pageSize = TRANSACTIONS_PAGE_SIZE } = filters;

  return useQuery({
    queryKey: ["transactions", { type, from, to, page, pageSize }],
    placeholderData: keepPreviousData, // no flicker while paging or filtering
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
        .order("id", { ascending: false }) // stable order for rows on the same day
        .range(page * pageSize, page * pageSize + pageSize - 1);

      if (type) query = query.eq("type", type);
      if (from) query = query.gte("date", from);
      if (to) query = query.lte("date", to);

      const { data, error, count } = await query;

      if (error) {
        // PostgREST answers "range not satisfiable" (PGRST103) when the page is
        // past the last row, for example after removing the only row on the last
        // page. Return an empty page with the real total, so the page can step
        // back to the last page instead of showing an error.
        if (error.code === "PGRST103") {
          let countQuery = supabase
            .from("transactions")
            .select("id", { count: "exact", head: true });

          if (type) countQuery = countQuery.eq("type", type);
          if (from) countQuery = countQuery.gte("date", from);
          if (to) countQuery = countQuery.lte("date", to);

          const { count: total, error: countError } = await countQuery;
          if (countError) throw countError;

          return { transactions: [] as Transaction[], total: total ?? 0 };
        }

        throw error;
      }

      return {
        transactions: (data ?? []) as unknown as Transaction[],
        total: count ?? 0,
      };
    },
  });
}

/* ------------------------------------------------------------------ */
/* Write                                                               */
/* ------------------------------------------------------------------ */

// A transaction change affects the list, the summary numbers and (for
// savings) goal progress, so refresh all of them. Keys that don't have
// a query yet are simply ignored.
function useRefreshAfterChange() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["summary"] }),
      queryClient.invalidateQueries({ queryKey: ["goals"] }),
    ]);
}

export function useCreateTransaction() {
  const refresh = useRefreshAfterChange();

  return useMutation({
    mutationFn: async (input: TransactionInput) => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You are not logged in.");

      // RLS requires user_id to be the logged-in user
      const { data, error } = await supabase
        .from("transactions")
        .insert({ user_id: user.id, ...input })
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    // Returning the promise keeps the mutation "pending" until the list
    // has refreshed, so the dialog closes on up-to-date data.
    onSuccess: () => refresh(),
  });
}

export function useUpdateTransaction() {
  const refresh = useRefreshAfterChange();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: TransactionInput;
    }) => {
      const supabase = createClient();

      // RLS only lets you update your own rows
      const { data, error } = await supabase
        .from("transactions")
        .update(input)
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Transaction not found.");
      return data;
    },
    onSuccess: () => refresh(),
  });
}

export function useDeleteTransaction() {
  const refresh = useRefreshAfterChange();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();

      // RLS only lets you delete your own rows
      const { data, error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Transaction not found.");
      return data;
    },
    onSuccess: () => refresh(),
  });
}