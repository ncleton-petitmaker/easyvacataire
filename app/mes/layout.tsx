"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Clock, Info, LogOut, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/mes/creneaux", label: "Mon planning", icon: Calendar },
  { href: "/mes/disponibilites", label: "Mes disponibilit\u00e9s", icon: Clock },
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-card">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 px-4">
          <GraduationCap className="size-6 text-primary" />
          <span className="text-lg font-semibold tracking-tight">
            EasyVacataire
          </span>
        </div>

        <Separator />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="lg"
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive && "font-semibold"
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <Separator />

        {/* User section */}
        <div className="p-3">
          <Button
            variant="ghost"
            size="lg"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Se d\u00e9connecter
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
