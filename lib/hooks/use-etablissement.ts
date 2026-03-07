"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const STORAGE_KEY = "uniplanning_etablissement_id";

export function useEtablissementId(): [string | null, (id: string) => void, boolean] {
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setId(stored);
      setLoading(false);
      return;
    }

    // Auto-detect from logged-in user's intervenant record
    async function autoDetect() {
      try {
        const supabase = createSupabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: intervenant } = await supabase
          .from("intervenants")
          .select("etablissement_id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (intervenant?.etablissement_id) {
          localStorage.setItem(STORAGE_KEY, intervenant.etablissement_id);
          setId(intervenant.etablissement_id);
        }
      } catch {
        // Silently fail
      }
      setLoading(false);
    }
    autoDetect();
  }, []);

  function setEtablissementId(newId: string) {
    localStorage.setItem(STORAGE_KEY, newId);
    setId(newId);
  }

  return [id, setEtablissementId, loading];
}
