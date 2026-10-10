"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/client";

export type Profile = {
  id: string;
  username: string | null;
  image: string | null;
};

export const PROFILE_QUERY_KEY = ["profile"] as const;

// `initialData` comes from the server layout, so the sidebar renders instantly
// with no loading flash. React Query then keeps it cached and shared with
// other components (for example, the profile page).
export function useProfile(initialData?: Profile) {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async (): Promise<Profile> => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, image")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    initialData,
  });
}