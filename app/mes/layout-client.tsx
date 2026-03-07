"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Clock, Info, LogOut, Menu, Loader2 } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/hooks/use-role";

const navItems = [
  { href: "/mes/creneaux", label: "Mon planning", icon: Calendar },
  { href: "/mes/disponibilites", label: "Mes disponibilités", icon: Clock },
  { href: "/mes/infos", label: "Infos pratiques", icon: Info },
];

function SidebarContent({ pathname, onNav, onLogout }: { pathname: string; onNav?: () => void; onLogout: () => void }) {
  return (
    <>
      <div className="px-6 pt-6 pb-2">
        <img src="/logo.svg" alt="EasyVacataire" className="h-6 brightness-0 invert" />
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
          Espace intervenant
        </p>
      </div>

      <div className="mx-4 my-3 h-px bg-white/10" />

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
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

      <div className="px-3 pb-4">
        <button
          onClick={() => { onNav?.(); onLogout(); }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="size-4 shrink-0" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </>
  );
}

export default function MesLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, roleLoading] = useRole("intervenant");

  async function handleLogout() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    localStorage.removeItem("easyvacataire_role");
    localStorage.removeItem("uniplanning_etablissement_id");
    router.push("/login");
  }

  if (roleLoading || role !== "intervenant") {
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
        <SidebarContent pathname={pathname} onLogout={handleLogout} />
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
              <SidebarContent pathname={pathname} onNav={() => setMobileOpen(false)} onLogout={handleLogout} />
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
