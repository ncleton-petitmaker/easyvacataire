"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, LogOut, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/super-admin", label: "Établissements", icon: Building2 },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-dvh">
      <aside
        className="flex w-64 flex-col text-white"
        style={{
          background: "linear-gradient(180deg, #1A1F2E 0%, #141820 100%)",
        }}
      >
        {/* Logo + Badge */}
        <div className="px-6 pt-6 pb-2">
          <img src="/logo.svg" alt="EasyVacataire" className="h-6 brightness-0 invert" />
          <span className="mt-2 inline-block rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Super Admin
          </span>
        </div>

        <div className="mx-4 my-3 h-px bg-white/10" />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/super-admin" &&
                pathname.startsWith(item.href + "/"));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
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

        {/* Footer */}
        <div className="space-y-1 px-3 pb-4">
          <a
            href="/api/auth/logout"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Déconnexion</span>
          </a>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#FAFAF9] p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
