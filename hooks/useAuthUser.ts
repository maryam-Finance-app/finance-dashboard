"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/client";

// The Supabase auth user (email, id...). Profile data lives in useProfile.
export function useAuthUser() {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });
}