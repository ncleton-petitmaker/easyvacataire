"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Menu,
  Loader2,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/hooks/use-role";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin/creneaux", label: "Planning", icon: Calendar },
  { href: "/admin/matching", label: "Matching", icon: Shuffle },
  { href: "/admin/besoins", label: "Besoins", icon: ClipboardList },
  { href: "/admin/intervenants", label: "Intervenants", icon: Users },
  { href: "/admin/matieres", label: "Matières", icon: BookOpen },
  { href: "/admin/knowledge", label: "Connaissances", icon: Brain },
  { href: "/admin/conversations", label: "Conversations", icon: MessageSquare },
];

function SidebarContent({ pathname, onNav, onLogout, isSuperAdmin }: { pathname: string; onNav?: () => void; onLogout: () => void; isSuperAdmin: boolean }) {
  return (
    <>
      <div className="px-6 pt-6 pb-2">
        <img src="/logo.svg" alt="EasyVacataire" className="h-6 brightness-0 invert" />
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
          Administration
        </p>
      </div>

      <div className="mx-4 my-3 h-px bg-white/10" />

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
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
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 my-3 h-px bg-white/10" />

      <div className="space-y-1 px-3 pb-4">
        {isSuperAdmin && (
          <Link
            href="/super-admin"
            onClick={onNav}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/10"
          >
            <Shield className="size-4 shrink-0" />
            <span>Super Admin</span>
          </Link>
        )}
        <button
          onClick={() => { onNav?.(); onLogout(); }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="size-4 shrink-0" />
          <span>Déconnexion</span>
        </button>
      </div>
    </>
  );
}

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, roleLoading] = useRole(["super_admin", "admin"]);

  async function handleLogout() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    localStorage.removeItem("easyvacataire_role");
    localStorage.removeItem("uniplanning_etablissement_id");
    router.push("/login");
  }

  if (roleLoading || !role || !["super_admin", "admin"].includes(role)) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#4243C4]" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh">
      <aside
        className="hidden md:flex w-64 flex-col text-white"
        style={{
          background: "linear-gradient(180deg, #1A1F2E 0%, #141820 100%)",
        }}
      >
        <SidebarContent pathname={pathname} onLogout={handleLogout} isSuperAdmin={role === "super_admin"} />
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
              <SidebarContent pathname={pathname} onNav={() => setMobileOpen(false)} onLogout={handleLogout} isSuperAdmin={role === "super_admin"} />
            </SheetContent>
          </Sheet>
          <img src="/logo.svg" alt="EasyVacataire" className="h-5 brightness-0 invert" />
        </header>

        <main className="flex-1 overflow-y-auto bg-[#FAFAF9] p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
