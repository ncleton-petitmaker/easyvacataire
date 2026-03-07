"use client";

import { useState, useRef } from "react";
import { Search, BookOpen, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SearchResult {
  title: string;
  content: string;
  category: string;
  similarity?: number;
}

const categoryLabels: Record<string, string> = {
  campus: "Campus",
  admin: "Proc\u00e9dures",
  pedagogie: "P\u00e9dagogie",
  faq: "FAQ",
};

const suggestions = [
  "Comment \u00e9marger ?",
  "O\u00f9 se garer sur le campus ?",
  "Comment \u00eatre rembours\u00e9 ?",
  "Quels documents fournir ?",
];

export default function MesInfosPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

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

  function handleSuggestionClick(suggestion: string) {
    setQuery(suggestion);
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 50);
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Infos pratiques</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Recherchez dans la base de connaissances de votre \u00e9tablissement.
      </p>

      {/* Barre de recherche */}
      <form ref={formRef} onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: comment \u00e9marger, o\u00f9 est le parking, proc\u00e9dure de remboursement..."
              className="h-10 pl-9"
            />
          </div>
          <Button type="submit" size="lg" disabled={searching}>
            {searching ? "Recherche..." : "Chercher"}
          </Button>
        </div>
      </form>

      {/* Suggestions */}
      {!searched && (
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((suggestion) => (
            <Card
              key={suggestion}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <CardContent className="flex items-center gap-3 py-4">
                <Sparkles className="size-4 text-primary" />
                <span className="text-sm">{suggestion}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* \u00c9tat de chargement */}
      {searching && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* R\u00e9sultats */}
      {searched && !searching && (
        <div className="space-y-4">
          {results.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="mx-auto mb-3 size-10 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Aucun r\u00e9sultat pour &laquo;&nbsp;{query}&nbsp;&raquo;
                </p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  Essayez avec d&apos;autres mots-cl\u00e9s ou contactez le secr\u00e9tariat.
                </p>
              </CardContent>
            </Card>
          ) : (
            results.map((result, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.title}
                    {result.category && (
                      <Badge variant="secondary">
                        {categoryLabels[result.category] || result.category}
                      </Badge>
                    )}
                  </CardTitle>
                  {result.similarity != null && (
                    <CardDescription>
                      Pertinence : {Math.round(result.similarity * 100)}%
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {result.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
