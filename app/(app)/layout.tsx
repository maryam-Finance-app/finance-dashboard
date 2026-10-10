import { redirect } from "next/navigation";
import AppSidebar from "@/components/layout/SideBar";
import QueryProvider from "@/components/providers/QueryProviders";
import { createClient } from "@/lib/server";
import type { Profile } from "@/hooks/userProfile";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, image")
    .eq("id", user.id)
    .single();

 
  const initialProfile: Profile = profile ?? {
    id: user.id,
    username: user.email?.split("@")[0] ?? null,
    image: null,
  };

  return (
    <QueryProvider>
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <AppSidebar initialProfile={initialProfile} />

          <main className="flex-1 overflow-x-hidden p-2 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </QueryProvider>
  );
}