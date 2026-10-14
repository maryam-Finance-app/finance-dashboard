"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/client";

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

      const { data, error } = await supabase
        .from("goals")
        .select("id, title, purchased_at")
        .order("title");

      if (error) throw error;
      return data as GoalOption[];
    },
  });
}