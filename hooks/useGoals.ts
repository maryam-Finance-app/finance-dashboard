"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/client";

/* ------------------------------------------------------------------ */
/* Lightweight list for pickers (the "Save toward" field)              */
/* ------------------------------------------------------------------ */

export type GoalOption = {
  id: string;
  title: string;
  purchased_at: string | null;
};

export function useGoals() {
  return useQuery({
    queryKey: ["goals", "options"],
    queryFn: async (): Promise<GoalOption[]> => {
      const supabase = createClient();

      // RLS limits this to the logged-in user's goals
      const { data, error } = await supabase
        .from("goals")
        .select("id, title, purchased_at")
        .order("title");

      if (error) throw error;
      return data as GoalOption[];
    },
  });
}

/* ------------------------------------------------------------------ */
/* Goals with calculated progress (the Goals page)                     */
/* ------------------------------------------------------------------ */

export type GoalProgress = {
  id: string;
  title: string;
  target_amount: number;
  purchased_at: string | null;
  saved_amount: number; // sum of the goal's savings transactions
  progress_percent: number; // can go above 100
  is_completed: boolean;
};

// Reads the goal_progress view, which calculates progress from the savings
// transactions. Progress is never stored, so it is always up to date.
export function useGoalProgress() {
  return useQuery({
    queryKey: ["goals", "progress"],
    queryFn: async (): Promise<GoalProgress[]> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("goal_progress")
        .select(
          "id, title, target_amount, purchased_at, saved_amount, progress_percent, is_completed"
        )
        // Active goals first, then the ones already bought (newest first)
        .order("purchased_at", { ascending: false, nullsFirst: true })
        .order("title");

      if (error) throw error;
      return data as GoalProgress[];
    },
  });
}

/* ------------------------------------------------------------------ */
/* Write                                                               */
/* ------------------------------------------------------------------ */

export type GoalInput = {
  title: string;
  target_amount: number;
};

// Goals feed the savings form and the transactions list. Deleting a goal
// removes its savings entries, and buying one adds an expense, so refresh
// all of those too. Keys that don't have a query yet are simply ignored.
function useRefreshAfterGoalChange() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["goals"] }),
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["summary"] }),
    ]);
}

export function useCreateGoal() {
  const refresh = useRefreshAfterGoalChange();

  return useMutation({
    mutationFn: async (input: GoalInput) => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You are not logged in.");

      // RLS requires user_id to be the logged-in user
      const { data, error } = await supabase
        .from("goals")
        .insert({ user_id: user.id, ...input })
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => refresh(),
  });
}

export function useUpdateGoal() {
  const refresh = useRefreshAfterGoalChange();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: GoalInput }) => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("goals")
        .update(input)
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Goal not found.");
      return data;
    },
    onSuccess: () => refresh(),
  });
}

export function useDeleteGoal() {
  const refresh = useRefreshAfterGoalChange();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();

      // The goal's savings transactions are deleted with it (ON DELETE CASCADE)
      const { data, error } = await supabase
        .from("goals")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Goal not found.");
      return data;
    },
    onSuccess: () => refresh(),
  });
}

// "Buy" a completed goal. The buy_goal database function does it in one
// step: it creates the expense transaction and sets goals.purchased_at.
export function useBuyGoal() {
  const refresh = useRefreshAfterGoalChange();

  return useMutation({
    mutationFn: async ({
      goalId,
      categoryId,
    }: {
      goalId: string;
      categoryId: string | null; // null = the default "Others" expense category
    }) => {
      const supabase = createClient();

      const { data, error } = await supabase.rpc("buy_goal", {
        p_goal_id: goalId,
        p_category_id: categoryId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => refresh(),
  });
}