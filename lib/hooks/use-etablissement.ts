"use client";

/**
 * For now, returns the first active etablissement.
 * Will be replaced by proper context when multi-tenant is needed.
 */

import { useState, useEffect } from "react";

const STORAGE_KEY = "uniplanning_etablissement_id";

export function useEtablissementId(): [string | null, (id: string) => void] {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setId(stored);
  }, []);

  function setEtablissementId(newId: string) {
    localStorage.setItem(STORAGE_KEY, newId);
    setId(newId);
  }

  return [id, setEtablissementId];
}
