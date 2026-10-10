"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export default function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Drop all cached data so the next user never sees the previous user's data
    queryClient.clear();
    router.push("/auth");
    router.refresh();
  };

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        onClick={handleLogout}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
      >
        <LogOut className="h-4 w-4" />
      </TooltipTrigger>
      <TooltipContent>Logout</TooltipContent>
    </Tooltip>
  );
}