"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowRightLeft,
  BarChart3,
  CircleUserRound,
  Goal,
  Menu,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Drawer, DrawerContent, DrawerTrigger } from "../ui/drawer";
import { Button } from "../ui/button";
import LogoutButton from "./LogoutButton";
import { useProfile, type Profile } from "@/hooks/userProfile";

const navs = [
  { title: "Transactions", href: "/", icon: ArrowRightLeft },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Goals", href: "/goals", icon: Goal },
  { title: "My Profile", href: "/profile", icon: CircleUserRound },
];

function SidebarItem({
  title,
  href,
  icon: Icon,
  onNavigate,
}: {
  title: string;
  href: string;
  icon: React.ElementType;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
        isActive &&
          "bg-slate-900 text-white shadow-sm hover:bg-slate-900 hover:text-white"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 transition-colors",
          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
        )}
      />
      <span>{title}</span>
    </Link>
  );
}

// A normal (sync) client component. Data comes from React Query, not from
// awaiting Supabase inside the component.
function SidebarContent({
  onNavigate,
  initialProfile,
}: {
  onNavigate?: () => void;
  initialProfile: Profile;
}) {
  const { data: profile } = useProfile(initialProfile);

  const username = profile?.username ?? "User";

  return (
    <>
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
          <WalletCards className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900">
            Finance
          </h1>
          <p className="text-xs text-slate-400">Dashboard</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Overview
        </p>
        {navs.map((nav) => (
          <SidebarItem
            key={nav.title}
            title={nav.title}
            href={nav.href}
            icon={nav.icon}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.image ?? undefined} alt={username} />
            <AvatarFallback className="bg-slate-100 text-xs font-semibold uppercase text-slate-700">
              {username[0]}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              <Link
                href="/profile"
                className="hover:text-slate-600"
                onClick={onNavigate}
              >
                {profile?.username}
              </Link>
            </p>
            <p className="truncate text-xs text-slate-400">Personal Finance</p>
          </div>

          <LogoutButton />
        </div>
      </div>
    </>
  );
}

export default function AppSidebar({
  initialProfile,
}: {
  initialProfile: Profile;
}) {
  const [openDrawer, setDrawer] = useState(false);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-62 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <SidebarContent initialProfile={initialProfile} />
      </aside>

      <div className="lg:hidden">
        <Drawer
          open={openDrawer}
          onOpenChange={setDrawer}
          swipeDirection="right"
        >
          <DrawerTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="m-4"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            }
          />

          <DrawerContent>
            <div className="flex h-full flex-col px-4 py-5">
              <SidebarContent
                initialProfile={initialProfile}
                onNavigate={() => setDrawer(false)}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}