"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LogOut, Menu } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/super-admin", label: "Établissements", icon: Building2 },
];

function SidebarContent({ pathname, onNav }: { pathname: string; onNav?: () => void }) {
  return (
    <>
      <div className="px-6 pt-6 pb-2">
        <img src="/logo.svg" alt="EasyVacataire" className="h-6 brightness-0 invert" />
        <span className="mt-2 inline-block rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
          Super Admin
        </span>
      </div>

      <div className="mx-4 my-3 h-px bg-white/10" />

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/super-admin" && pathname.startsWith(item.href + "/"));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border border-[#4243C4]/30 bg-[#4243C4]/20 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 my-3 h-px bg-white/10" />

      <div className="space-y-1 px-3 pb-4">
        <a
          href="/api/auth/logout"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="size-4 shrink-0" />
          <span>Déconnexion</span>
        </a>
      </div>
    </>
  );
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh">
      <aside
        className="hidden md:flex w-64 flex-col text-white"
        style={{
          background: "linear-gradient(180deg, #1A1F2E 0%, #141820 100%)",
        }}
      >
        <SidebarContent pathname={pathname} />
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header
          className="flex md:hidden h-14 items-center gap-3 px-4 text-white"
          style={{
            background: "linear-gradient(90deg, #1A1F2E 0%, #141820 100%)",
          }}
        >
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <button className="flex items-center justify-center size-9 rounded-lg hover:bg-white/10 transition-colors">
                  <Menu className="size-5" />
                </button>
              }
            />
            <SheetContent
              side="left"
              showCloseButton={false}
              className="w-64 p-0 text-white"
              style={{
                background: "linear-gradient(180deg, #1A1F2E 0%, #141820 100%)",
              }}
            >
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SidebarContent pathname={pathname} onNav={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <img src="/logo.svg" alt="EasyVacataire" className="h-5 brightness-0 invert" />
        </header>

        <main className="flex-1 overflow-y-auto bg-[#FAFAF9] p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
