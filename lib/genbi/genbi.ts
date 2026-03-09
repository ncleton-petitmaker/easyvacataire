/**
 * Module GenBI — interrogation de la base de données en langage naturel.
 * Détection d'intent + génération SQL + exécution + formatage.
 */

import {
  INTENT_DETECT_PROMPT,
  SQL_GEN_SYSTEM_PROMPT,
} from "./genbi-config";
import { wrenQuery, wrenDryRun } from "./wren-client";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

function getApiKey(): string {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error("MISTRAL_API_KEY is not set");
  return key;
}

async function callMistralChat(
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number = 0.1,
  maxTokens: number = 1024
): Promise<string> {
  const res = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mistral API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const choices = data.choices as Array<{
    message: { content: string };
  }>;
  return choices[0]?.message?.content || "";
}

// ── Intent Detection ──

export interface GenBIIntent {
  intent: "genbi_search" | "genbi_stats" | "none";
  confidence: number;
}

export async function detectGenBIIntent(
  query: string
): Promise<GenBIIntent> {
  try {
    const response = await callMistralChat(
      "ministral-3b-latest",
      [
        { role: "system", content: INTENT_DETECT_PROMPT },
        { role: "user", content: query },
      ],
      0.1,
      128
    );

    // Extraire le JSON de la réponse (tolérant aux blocs code)
    const jsonMatch = response.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      return { intent: "none", confidence: 0 };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      intent: parsed.intent || "none",
      confidence: parsed.confidence || 0,
    };
  } catch (err) {
    console.error("[genbi] Intent detection error:", err);
    return { intent: "none", confidence: 0 };
  }
}

// ── SQL Generation ──

export async function generateSQL(
  query: string,
  etablissementId: string,
  intervenantId?: string
): Promise<string> {
  const systemPrompt = SQL_GEN_SYSTEM_PROMPT.replace(
    /\{etab_id\}/g,
    etablissementId
  );

  let userPrompt = query;
  if (intervenantId) {
    userPrompt += `\n\nIMPORTANT : Filtre aussi par intervenant_id = '${intervenantId}' (l'utilisateur ne peut voir que ses propres données).`;
  }

  const MAX_RETRIES = 3;
  let lastError = "";

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    if (attempt > 0 && lastError) {
      messages.push({
        role: "user",
        content: `La requête précédente a échoué avec l'erreur : ${lastError}\nCorrige la requête SQL.`,
      });
    }

    const response = await callMistralChat(
      "mistral-small-latest",
      messages,
      0.1,
      1024
    );

    // Extraire le SQL (enlever les blocs markdown et le ; final)
    let sql = response
      .replace(/```sql\n?/gi, "")
      .replace(/```\n?/g, "")
      .trim()
      .replace(/;\s*$/, "");

    // Remplacer les placeholders
    sql = sql.replace(/'\{etab_id\}'/g, `'${etablissementId}'`);
    if (intervenantId) {
      sql = sql.replace(
        /'\{intervenant_id\}'/g,
        `'${intervenantId}'`
      );
    }

    // Vérification basique
    if (
      sql.match(
        /^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)/i
      )
    ) {
      lastError = "Seules les requêtes SELECT sont autorisées";
      continue;
    }

    // Ajouter LIMIT si absent
    if (!/LIMIT\s+\d+/i.test(sql)) {
      sql = sql.replace(/;\s*$/, "");
      sql += " LIMIT 50";
    }

    return sql;
  }

  throw new Error(
    `Impossible de générer une requête SQL valide après ${MAX_RETRIES} tentatives`
  );
}

// ── SQL Execution ──

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
}

export async function executeReadonlySQL(
  sql: string,
  _etablissementId: string
): Promise<QueryResult> {
  // Vérification basique côté client
  if (
    sql.match(
      /^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)/i
    )
  ) {
    throw new Error("Seules les requêtes SELECT sont autorisées");
  }

  // Dry run via Wren pour valider le SQL
  const isValid = await wrenDryRun(sql);
  if (!isValid) {
    throw new Error("Requête SQL invalide (Wren dry run failed)");
  }

  // Exécuter via Wren Engine
  const result = await wrenQuery(sql);

  // Convertir le format Wren (columns + data) en rows
  const rows: Record<string, unknown>[] = result.data.map((row) => {
    const obj: Record<string, unknown> = {};
    result.columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });

  return { rows, rowCount: rows.length };
}

// ── Result Formatting ──

export function formatSearchResults(
  result: QueryResult
): string {
  if (result.rowCount === 0) {
    return "Aucun résultat trouvé pour cette recherche.";
  }

  const rows = result.rows;
  const columns = Object.keys(rows[0]);

  // Format tabulaire lisible en WhatsApp
  const lines: string[] = [];
  for (const row of rows) {
    const parts = columns.map((col) => {
      const val = row[col];
      const label = col.replace(/_/g, " ");
      return `*${label}* : ${val ?? "—"}`;
    });
    lines.push(parts.join(" | "));
  }

  return lines.join("\n");
}

export async function formatStatsResults(
  query: string,
  result: QueryResult
): Promise<string> {
  if (result.rowCount === 0) {
    return "Aucune donnée trouvée pour cette analyse.";
  }

  // Si résultat simple (1 ligne, 1 colonne) — réponse directe
  if (result.rowCount === 1 && Object.keys(result.rows[0]).length <= 2) {
    const values = Object.entries(result.rows[0])
      .map(([k, v]) => `${k.replace(/_/g, " ")} : *${v}*`)
      .join(", ");
    return values;
  }

  // Pour des résultats plus complexes, reformuler via LLM
  try {
    const response = await callMistralChat(
      "ministral-3b-latest",
      [
        {
          role: "system",
          content:
            "Tu reformules des résultats de base de données en réponse naturelle en français pour WhatsApp. Sois concis. Utilise *gras* pour les chiffres clés.",
        },
        {
          role: "user",
          content: `Question : ${query}\n\nRésultats :\n${JSON.stringify(result.rows, null, 2)}`,
        },
      ],
      0.3,
      512
    );
    return response;
  } catch {
    // Fallback : formatage tabulaire
    return formatSearchResults(result);
  }
}

// ── Pipeline complet ──

export interface GenBIContext {
  etablissementId: string;
  intervenantId?: string;
  isAdmin: boolean;
}

export async function runGenBIPipeline(
  query: string,
  intent: "genbi_search" | "genbi_stats",
  ctx: GenBIContext
): Promise<string> {
  try {
    // Générer le SQL (scopé si non-admin)
    const sql = await generateSQL(
      query,
      ctx.etablissementId,
      ctx.isAdmin ? undefined : ctx.intervenantId
    );

    console.log("[genbi] SQL généré :", sql);

    // Exécuter
    const result = await executeReadonlySQL(sql, ctx.etablissementId);

    // Formater selon le type d'intent
    if (intent === "genbi_stats") {
      return await formatStatsResults(query, result);
    }
    return formatSearchResults(result);
  } catch (err) {
    console.error("[genbi] Pipeline error:", err);
    const message =
      err instanceof Error ? err.message : "Erreur inconnue";
    return `Désolé, je n'ai pas pu exécuter cette requête. ${message}`;
  }
}
