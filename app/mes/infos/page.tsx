"use client";

import { useState } from "react";

interface SearchResult {
  title: string;
  content: string;
  category: string;
  similarity?: number;
}

export default function MesInfosPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/knowledge/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    }
    setSearching(false);
  }

  const categoryLabels: Record<string, string> = {
    campus: "Campus",
    admin: "Procédures",
    pedagogie: "Pédagogie",
    faq: "FAQ",
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Infos pratiques
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Recherchez dans la base de connaissances de votre établissement
      </p>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: comment émarger, où est le parking, procédure de remboursement..."
            className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {searching ? "Recherche..." : "Chercher"}
          </button>
        </div>
      </form>

      {/* Suggestions */}
      {!searched && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            "Comment émarger ?",
            "Où se garer sur le campus ?",
            "Comment être remboursé ?",
            "Quels documents fournir ?",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setQuery(suggestion);
                // Trigger search
                setTimeout(() => {
                  const form = document.querySelector("form");
                  form?.requestSubmit();
                }, 50);
              }}
              className="rounded-xl border border-zinc-200 bg-white p-4 text-left text-sm text-zinc-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-indigo-600"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-800">
              <p className="text-zinc-500">
                Aucun résultat pour &quot;{query}&quot;
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Essayez avec d&apos;autres mots-clés ou contactez le
                secrétariat
              </p>
            </div>
          ) : (
            results.map((result, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                    {result.title}
                  </h3>
                  {result.category && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {categoryLabels[result.category] || result.category}
                    </span>
                  )}
                  {result.similarity && (
                    <span className="text-xs text-zinc-400">
                      {Math.round(result.similarity * 100)}%
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                  {result.content}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
