"use client";

import { useQuery } from "@tanstack/react-query";
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