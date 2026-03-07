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
  UserCircle,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside className="flex w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* Logo */}
        <div className="px-6 pt-6 pb-2">
          <img src="/logo.svg" alt="EasyVacataire" className="h-6" />
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Administration
          </p>
        </div>

        <Separator className="mx-4 my-3 w-auto" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3">
          <TooltipProvider>
            <nav className="space-y-1 py-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger
                      render={
                        <Link
                          href={item.href}
                          className={cn(
                            buttonVariants({
                              variant: isActive ? "secondary" : "ghost",
                              size: "lg",
                            }),
                            "w-full justify-start gap-3 font-medium",
                            isActive
                              ? "bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/25"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        />
                      }
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </TooltipProvider>
        </ScrollArea>

        <Separator className="mx-4 my-3 w-auto" />

        {/* Utilisateur et déconnexion */}
        <div className="px-3 pb-4 space-y-2">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <UserCircle className="size-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                Administrateur
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Établissement
              </p>
            </div>
          </div>

          <a
            href="/api/auth/logout"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
            )}
          >
            <LogOut className="size-4 shrink-0" />
            <span>Déconnexion</span>
          </a>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">{children}</main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
