"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/client";

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
};

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    staleTime: Infinity,
    queryFn: async (): Promise<Category[]> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("categories")
        .select("id, name, type")
        .order("name");

      if (error) throw error;
      return data as Category[];
    },
  });
}