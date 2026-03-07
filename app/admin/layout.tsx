"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Shuffle,
  ClipboardList,
  Users,
  BookOpen,
  Brain,
  MessageSquare,
  LogOut,
  Shield,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/creneaux", label: "Planning", icon: Calendar },
  { href: "/admin/matching", label: "Matching", icon: Shuffle },
  { href: "/admin/besoins", label: "Besoins", icon: ClipboardList },
  { href: "/admin/intervenants", label: "Intervenants", icon: Users },
  { href: "/admin/matieres", label: "Matières", icon: BookOpen },
  { href: "/admin/knowledge", label: "Base de connaissances", icon: Brain },
  { href: "/admin/conversations", label: "Conversations", icon: MessageSquare },
];

export default function AdminLayout({
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
        {/* Logo */}
        <div className="px-6 pt-6 pb-2">
          <img src="/logo.svg" alt="EasyVacataire" className="h-6 brightness-0 invert" />
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
            Administration
          </p>
        </div>

        <div className="mx-4 my-3 h-px bg-white/10" />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
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
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mx-4 my-3 h-px bg-white/10" />

        {/* Footer */}
        <div className="space-y-1 px-3 pb-4">
          <Link
            href="/super-admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/10"
          >
            <Shield className="size-4 shrink-0" />
            <span>Super Admin</span>
          </Link>
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
      <Toaster position="top-right" richColors />
    </div>
  );
}
