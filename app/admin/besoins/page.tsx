"use client";

import { useState, useEffect, useCallback } from "react";
import { useEtablissementId } from "@/lib/hooks/use-etablissement";

type Matiere = { id: string; name: string; code: string | null };
type Besoin = {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  notes: string | null;
  status: string;
  matieres: Matiere | null;
};

export default function BesoinsPage() {
  const [etablissementId] = useEtablissementId();
  const [besoins, setBesoins] = useState<Besoin[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState({
    date: "",
    heure_debut: "08:00",
    heure_fin: "10:00",
    matiere_id: "",
    salle: "",
    notes: "",
  });

  const load = useCallback(async () => {
    if (!etablissementId) return;
    const [besoinsRes, matieresRes] = await Promise.all([
      fetch(`/api/besoins?etablissement_id=${etablissementId}`),
      fetch(`/api/matieres?etablissement_id=${etablissementId}`),
    ]);
    const besoinsData = await besoinsRes.json();
    const matieresData = await matieresRes.json();
    if (Array.isArray(besoinsData)) setBesoins(besoinsData);
    if (Array.isArray(matieresData)) setMatieres(matieresData);
  }, [etablissementId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!etablissementId) return;
    await fetch("/api/besoins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        etablissement_id: etablissementId,
        matiere_id: form.matiere_id || undefined,
        date: form.date,
        heure_debut: form.heure_debut,
        heure_fin: form.heure_fin,
        salle: form.salle || undefined,
        notes: form.notes || undefined,
      }),
    });
    setForm({ date: "", heure_debut: "08:00", heure_fin: "10:00", matiere_id: "", salle: "", notes: "" });
    setShowForm(false);
    load();
  }

  async function handleCancel(id: string) {
    if (!confirm("Annuler ce besoin ?")) return;
    await fetch(`/api/besoins/${id}`, { method: "DELETE" });
    load();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !etablissementId) return;
    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("etablissement_id", etablissementId);
    formData.append("type", "besoins");
    const res = await fetch("/api/import", { method: "POST", body: formData });
    const result = await res.json();
    alert(`${result.imported} besoins importés${result.errors?.length ? `\n${result.errors.join("\n")}` : ""}`);
    setImporting(false);
    load();
  }

  const statusColors: Record<string, string> = {
    ouvert: "bg-green-100 text-green-700",
    attribue: "bg-blue-100 text-blue-700",
    annule: "bg-zinc-100 text-zinc-500",
  };

  if (!etablissementId) {
    return <div className="text-zinc-500">Aucun établissement sélectionné.</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Besoins en créneaux
        </h1>
        <div className="flex gap-2">
          <label className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
            {importing ? "Import..." : "Importer CSV"}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
              disabled={importing}
            />
          </label>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            + Ajouter
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="grid grid-cols-3 gap-4">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              type="time"
              value={form.heure_debut}
              onChange={(e) =>
                setForm({ ...form, heure_debut: e.target.value })
              }
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              type="time"
              value={form.heure_fin}
              onChange={(e) => setForm({ ...form, heure_fin: e.target.value })}
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <select
              value={form.matiere_id}
              onChange={(e) =>
                setForm({ ...form, matiere_id: e.target.value })
              }
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="">— Matière (optionnel) —</option>
              {matieres.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code ? `${m.code} - ` : ""}{m.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Salle"
              value={form.salle}
              onChange={(e) => setForm({ ...form, salle: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Horaire</th>
              <th className="px-4 py-3 font-medium">Matière</th>
              <th className="px-4 py-3 font-medium">Salle</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {besoins.map((b) => (
              <tr
                key={b.id}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                  {b.date}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {b.heure_debut} - {b.heure_fin}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {b.matieres
                    ? `${b.matieres.code ? b.matieres.code + " - " : ""}${b.matieres.name}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {b.salle || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${statusColors[b.status] || ""}`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {b.status === "ouvert" && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Annuler
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {besoins.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-zinc-400"
                >
                  Aucun besoin enregistré
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
