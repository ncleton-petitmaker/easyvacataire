"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const STORAGE_KEY = "easyvacataire_role";

type Role = "super_admin" | "admin" | "intervenant" | null;

/**
 * Hook that returns the current user's role.
 * Reads from localStorage first, then falls back to Supabase user_metadata.
 * If requiredRole is provided, redirects to the correct interface if role doesn't match.
 */
export function useRole(requiredRole?: string | string[]): [Role, boolean] {
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function detect() {
      // 1. Check localStorage
      const stored = localStorage.getItem(STORAGE_KEY) as Role;
      if (stored && ["super_admin", "admin", "intervenant"].includes(stored)) {
        setRole(stored);
        setLoading(false);
        return;
      }

      // 2. Fall back to Supabase user_metadata
      try {
        const supabase = createSupabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          router.push("/login");
          return;
        }

        const metaRole = user.user_metadata?.role as Role;
        if (metaRole) {
          localStorage.setItem(STORAGE_KEY, metaRole);
          setRole(metaRole);
          setLoading(false);
          return;
        }

        // 3. No role found — default to intervenant
        setRole("intervenant");
        localStorage.setItem(STORAGE_KEY, "intervenant");
      } catch {
        setRole(null);
      }
      setLoading(false);
    }
    detect();
  }, [router]);

  // Redirect if role doesn't match
  useEffect(() => {
    if (loading || !role || !requiredRole) return;

    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (allowed.includes(role)) return;

    // Redirect to correct interface
    if (role === "super_admin") {
      router.replace("/super-admin");
    } else if (role === "admin") {
      router.replace("/admin/creneaux");
    } else {
      router.replace("/mes/creneaux");
    }
  }, [role, loading, requiredRole, router]);

  return [role, loading];
}
