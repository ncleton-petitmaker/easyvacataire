"use client";

import { useState, useEffect, useCallback } from "react";
import { useEtablissementId } from "@/lib/hooks/use-etablissement";

type Intervenant = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  specialite: string | null;
  role: string;
};

export default function IntervenantsPage() {
  const [etablissementId] = useEtablissementId();
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "+33",
    email: "",
    specialite: "",
    role: "intervenant",
  });
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    if (!etablissementId) return;
    const res = await fetch(
      `/api/intervenants?etablissement_id=${etablissementId}`
    );
    const data = await res.json();
    if (Array.isArray(data)) setIntervenants(data);
  }, [etablissementId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!etablissementId) return;
    await fetch("/api/intervenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, etablissement_id: etablissementId }),
    });
    setForm({ first_name: "", last_name: "", phone: "+33", email: "", specialite: "", role: "intervenant" });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Désactiver cet intervenant ?")) return;
    await fetch(`/api/intervenants/${id}`, { method: "DELETE" });
    load();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !etablissementId) return;
    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("etablissement_id", etablissementId);
    formData.append("type", "intervenants");
    const res = await fetch("/api/import", { method: "POST", body: formData });
    const result = await res.json();
    alert(`${result.imported} intervenants importés${result.errors?.length ? `\n${result.errors.join("\n")}` : ""}`);
    setImporting(false);
    load();
  }

  if (!etablissementId) {
    return (
      <div className="text-zinc-500">
        Aucun établissement sélectionné. Configurez-le dans les paramètres.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Intervenants
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
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Prénom"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              placeholder="Nom"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              placeholder="Téléphone (+33...)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              placeholder="Email (optionnel)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              placeholder="Spécialité (optionnel)"
              value={form.specialite}
              onChange={(e) => setForm({ ...form, specialite: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="intervenant">Intervenant</option>
              <option value="admin">Admin</option>
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

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800">
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Téléphone</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Spécialité</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {intervenants.map((i) => (
              <tr
                key={i.id}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                  {i.first_name} {i.last_name}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {i.phone}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {i.email || "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {i.specialite || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      i.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {i.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(i.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {intervenants.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-zinc-400"
                >
                  Aucun intervenant
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
