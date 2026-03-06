"use client";

import { useState, useEffect, useCallback } from "react";

type Etablissement = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  intervenants_count: number;
};

type Admin = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
};

export default function SuperAdminPage() {
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Track expanded etablissements and their admins
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [admins, setAdmins] = useState<Record<string, Admin[]>>({});
  const [loadingAdmins, setLoadingAdmins] = useState<string | null>(null);

  // Add admin form state
  const [addAdminForId, setAddAdminForId] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({
    phone: "+33",
    first_name: "",
    last_name: "",
  });
  const [addingAdmin, setAddingAdmin] = useState(false);

  const loadEtablissements = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/etablissements");
    const data = await res.json();
    if (Array.isArray(data)) setEtablissements(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEtablissements();
  }, [loadEtablissements]);

  async function loadAdmins(etablissementId: string) {
    setLoadingAdmins(etablissementId);
    const res = await fetch(`/api/etablissements/${etablissementId}/admins`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setAdmins((prev) => ({ ...prev, [etablissementId]: data }));
    }
    setLoadingAdmins(null);
  }

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setAddAdminForId(null);
    } else {
      setExpandedId(id);
      setAddAdminForId(null);
      if (!admins[id]) {
        loadAdmins(id);
      }
    }
  }

  function generateSlug(name: string) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/etablissements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName }),
    });
    if (res.ok) {
      setCreateName("");
      setShowCreateForm(false);
      loadEtablissements();
    } else {
      const data = await res.json();
      setCreateError(data.error || "Erreur lors de la creation");
    }
    setCreating(false);
  }

  async function handleAddAdmin(e: React.FormEvent, etablissementId: string) {
    e.preventDefault();
    setAddingAdmin(true);
    const res = await fetch("/api/intervenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...adminForm,
        role: "admin",
        etablissement_id: etablissementId,
      }),
    });
    if (res.ok) {
      setAdminForm({ phone: "+33", first_name: "", last_name: "" });
      setAddAdminForId(null);
      loadAdmins(etablissementId);
      loadEtablissements();
    }
    setAddingAdmin(false);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Etablissements
        </h1>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setCreateError("");
          }}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + Nouvel etablissement
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Creer un etablissement
          </h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Nom</label>
              <input
                placeholder="Nom de l'etablissement"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">
                Slug (auto-genere)
              </label>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
                {generateSlug(createName) || "—"}
              </div>
            </div>
          </div>
          {createError && (
            <p className="mt-3 text-sm text-red-600">{createError}</p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {creating ? "Creation..." : "Creer"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center text-zinc-400">Chargement...</div>
      ) : etablissements.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
          Aucun etablissement
        </div>
      ) : (
        <div className="space-y-3">
          {etablissements.map((etab) => (
            <div
              key={etab.id}
              className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Etablissement header */}
              <button
                onClick={() => toggleExpand(etab.id)}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
              >
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {etab.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    /{etab.slug} &middot; {etab.intervenants_count}{" "}
                    intervenant{etab.intervenants_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      etab.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {etab.is_active ? "Actif" : "Inactif"}
                  </span>
                  <svg
                    className={`h-4 w-4 text-zinc-400 transition-transform ${
                      expandedId === etab.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded admin list */}
              {expandedId === etab.id && (
                <div className="border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Administrateurs
                    </h4>
                    <button
                      onClick={() =>
                        setAddAdminForId(
                          addAdminForId === etab.id ? null : etab.id
                        )
                      }
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      + Ajouter un admin
                    </button>
                  </div>

                  {/* Add admin form */}
                  {addAdminForId === etab.id && (
                    <form
                      onSubmit={(e) => handleAddAdmin(e, etab.id)}
                      className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          placeholder="Prenom"
                          value={adminForm.first_name}
                          onChange={(e) =>
                            setAdminForm({
                              ...adminForm,
                              first_name: e.target.value,
                            })
                          }
                          required
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700"
                        />
                        <input
                          placeholder="Nom"
                          value={adminForm.last_name}
                          onChange={(e) =>
                            setAdminForm({
                              ...adminForm,
                              last_name: e.target.value,
                            })
                          }
                          required
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700"
                        />
                        <input
                          placeholder="Telephone (+33...)"
                          value={adminForm.phone}
                          onChange={(e) =>
                            setAdminForm({
                              ...adminForm,
                              phone: e.target.value,
                            })
                          }
                          required
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700"
                        />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="submit"
                          disabled={addingAdmin}
                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                          {addingAdmin ? "Ajout..." : "Ajouter"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddAdminForId(null)}
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-600"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Admin list */}
                  {loadingAdmins === etab.id ? (
                    <p className="py-4 text-center text-xs text-zinc-400">
                      Chargement...
                    </p>
                  ) : (admins[etab.id] || []).length === 0 ? (
                    <p className="py-4 text-center text-xs text-zinc-400">
                      Aucun administrateur
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(admins[etab.id] || []).map((admin) => (
                        <div
                          key={admin.id}
                          className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-2.5 dark:bg-zinc-800"
                        >
                          <div>
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {admin.first_name} {admin.last_name}
                            </span>
                          </div>
                          <span className="text-sm text-zinc-500">
                            {admin.phone}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
