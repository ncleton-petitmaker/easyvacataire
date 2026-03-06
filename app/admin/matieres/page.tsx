"use client";

import { useState, useEffect, useCallback } from "react";
import { useEtablissementId } from "@/lib/hooks/use-etablissement";

type Matiere = {
  id: string;
  code: string | null;
  name: string;
  volume_horaire_total: number | null;
  description: string | null;
};

export default function MatieresPage() {
  const [etablissementId] = useEtablissementId();
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    volume_horaire_total: "",
    description: "",
  });

  const load = useCallback(async () => {
    if (!etablissementId) return;
    const res = await fetch(
      `/api/matieres?etablissement_id=${etablissementId}`
    );
    const data = await res.json();
    if (Array.isArray(data)) setMatieres(data);
  }, [etablissementId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!etablissementId) return;
    await fetch("/api/matieres", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        etablissement_id: etablissementId,
        code: form.code || undefined,
        name: form.name,
        volume_horaire_total: form.volume_horaire_total
          ? parseInt(form.volume_horaire_total)
          : undefined,
        description: form.description || undefined,
      }),
    });
    setForm({ code: "", name: "", volume_horaire_total: "", description: "" });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette matière ?")) return;
    await fetch(`/api/matieres/${id}`, { method: "DELETE" });
    load();
  }

  if (!etablissementId) {
    return (
      <div className="text-zinc-500">
        Aucun établissement sélectionné.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Matières / Modules
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
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Code (ex: INF301)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              placeholder="Nom de la matière *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              placeholder="Volume horaire total (min)"
              type="number"
              value={form.volume_horaire_total}
              onChange={(e) =>
                setForm({ ...form, volume_horaire_total: e.target.value })
              }
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
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

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Volume (h)</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {matieres.map((m) => (
              <tr
                key={m.id}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                  {m.code || "—"}
                </td>
                <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                  {m.name}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {m.volume_horaire_total
                    ? `${Math.round(m.volume_horaire_total / 60)}h`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {m.description || "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {matieres.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-zinc-400"
                >
                  Aucune matière
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
