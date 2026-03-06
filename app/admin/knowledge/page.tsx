"use client";

import { useState, useEffect, useCallback } from "react";
import { useEtablissementId } from "@/lib/hooks/use-etablissement";

type KnowledgeEntry = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  source_type: string;
  is_active: boolean;
  created_at: string;
};

const categories = [
  { value: "", label: "Toutes" },
  { value: "campus", label: "Campus" },
  { value: "admin", label: "Procédures admin" },
  { value: "pedagogie", label: "Pédagogie" },
  { value: "faq", label: "FAQ" },
];

export default function KnowledgePage() {
  const [etablissementId] = useEtablissementId();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "faq",
  });

  const load = useCallback(async () => {
    if (!etablissementId) return;
    const res = await fetch(
      `/api/knowledge?etablissement_id=${etablissementId}`
    );
    const data = await res.json();
    if (Array.isArray(data)) setEntries(data);
  }, [etablissementId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!etablissementId) return;
    await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        etablissement_id: etablissementId,
        ...form,
      }),
    });
    setForm({ title: "", content: "", category: "faq" });
    setShowForm(false);
    load();
  }

  async function handleReindex(id: string) {
    const btn = document.getElementById(`reindex-${id}`);
    if (btn) btn.textContent = "Indexation...";
    try {
      const res = await fetch("/api/knowledge/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knowledge_id: id }),
      });
      const data = await res.json();
      if (btn) btn.textContent = `${data.chunks_indexed || 0} chunks`;
      setTimeout(() => {
        if (btn) btn.textContent = "Re-indexer";
      }, 2000);
    } catch {
      if (btn) btn.textContent = "Erreur";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette entrée ?")) return;
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = filter
    ? entries.filter((e) => e.category === filter)
    : entries;

  if (!etablissementId) {
    return <div className="text-zinc-500">Aucun établissement sélectionné.</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Base de connaissances
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          + Ajouter
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="space-y-4">
            <input
              placeholder="Titre *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <textarea
              placeholder="Contenu *"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              rows={6}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              {categories.slice(1).map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 flex gap-2">
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilter(c.value)}
            className={`rounded-full px-3 py-1 text-xs ${
              filter === c.value
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                  {entry.title}
                </h3>
                <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                  {entry.category}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  id={`reindex-${entry.id}`}
                  onClick={() => handleReindex(entry.id)}
                  className="text-xs text-indigo-500 hover:text-indigo-700"
                >
                  Re-indexer
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-zinc-600 line-clamp-3 dark:text-zinc-400">
              {entry.content}
            </p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-400">
            Aucune entrée dans la base de connaissances
          </p>
        )}
      </div>
    </div>
  );
}
