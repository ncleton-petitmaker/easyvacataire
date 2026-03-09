/**
 * Client Wren Engine — exécution SQL via ibis-server + semantic layer.
 */

import { readFileSync } from "fs";
import { join } from "path";

const WREN_IBIS_URL =
  process.env.WREN_IBIS_URL || "http://localhost:8000";

// Charger et encoder le MDL en base64 (une seule fois)
let _manifestStr: string | null = null;

function getManifestStr(): string {
  if (_manifestStr) return _manifestStr;

  try {
    const mdlPath = join(process.cwd(), "wren", "etc", "mdl", "mdl.json");
    const mdl = readFileSync(mdlPath, "utf-8");
    _manifestStr = Buffer.from(mdl).toString("base64");
  } catch {
    // Fallback : MDL inline minimal
    const mdl = JSON.stringify({
      catalog: "easyvacataire",
      schema: "public",
      models: [],
      relationships: [],
    });
    _manifestStr = Buffer.from(mdl).toString("base64");
  }

  return _manifestStr;
}

function getConnectionInfo() {
  return {
    host: process.env.SUPABASE_DB_HOST || "localhost",
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: process.env.SUPABASE_DB_PASSWORD || "",
  };
}

export interface WrenQueryResult {
  columns: string[];
  data: unknown[][];
  dtypes: Record<string, string>;
}

/**
 * Exécute une requête SQL via Wren ibis-server.
 */
export async function wrenQuery(sql: string): Promise<WrenQueryResult> {
  const res = await fetch(`${WREN_IBIS_URL}/v2/ibis/postgres/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sql,
      manifestStr: getManifestStr(),
      connectionInfo: getConnectionInfo(),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Wren query error ${res.status}: ${errText}`);
  }

  return res.json();
}

/**
 * Valide une requête SQL sans l'exécuter (dry run).
 */
export async function wrenDryRun(sql: string): Promise<boolean> {
  const res = await fetch(
    `${WREN_IBIS_URL}/v2/ibis/postgres/query?dryRun=true`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sql,
        manifestStr: getManifestStr(),
        connectionInfo: getConnectionInfo(),
      }),
    }
  );

  return res.status === 204;
}
