"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Clock, Info, LogOut, GraduationCap } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/mes/creneaux", label: "Mon planning", icon: Calendar },
  { href: "/mes/disponibilites", label: "Mes disponibilités", icon: Clock },
  { href: "/mes/infos", label: "Infos pratiques", icon: Info },
];

export default function MesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/");
  }

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
            Espace intervenant
          </p>
        </div>

        <div className="mx-4 my-3 h-px bg-white/10" />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
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
        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#FAFAF9] p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
