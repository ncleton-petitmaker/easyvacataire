/**
 * Semantic Router — routage par embeddings (centroïdes) pour
 * court-circuiter le tool-calling sur les intentions évidentes.
 */

import { generateQueryEmbedding } from "./embeddings";

// ── Types ──

export type RouteKey =
  | "genbi_search"
  | "genbi_stats"
  | "planning"
  | "disponibilites"
  | "knowledge"
  | "greeting"
  | "none";

interface Route {
  key: RouteKey;
  utterances: string[];
  centroid?: number[];
}

// ── Définition des routes ──

const ROUTES: Route[] = [
  {
    key: "genbi_search",
    utterances: [
      "Quels intervenants sont disponibles mardi ?",
      "Qui enseigne le droit ?",
      "Quels besoins ne sont pas couverts ?",
      "Liste des cours annulés",
      "Quels créneaux sont libres cette semaine ?",
      "Quels intervenants sont actifs ?",
      "Quels cours a lieu en salle B204 ?",
    ],
  },
  {
    key: "genbi_stats",
    utterances: [
      "Combien de créneaux cette semaine ?",
      "Combien d'heures ce mois ?",
      "Répartition des cours par matière",
      "Statistiques des interventions",
      "Nombre de besoins ouverts",
      "Total des heures de Pierre Dupont en mars",
      "Combien d'intervenants actifs ?",
    ],
  },
  {
    key: "planning",
    utterances: [
      "Mon planning",
      "Mes prochains cours",
      "Quand est mon prochain cours ?",
      "Mon emploi du temps",
      "Mes créneaux de la semaine",
    ],
  },
  {
    key: "disponibilites",
    utterances: [
      "Je suis libre mardi après-midi",
      "Mes disponibilités",
      "Je suis disponible la semaine prochaine",
      "Je ne suis pas libre vendredi",
      "Enregistrer mes dispos",
      "Modifier mes disponibilités",
    ],
  },
  {
    key: "knowledge",
    utterances: [
      "Où est la salle B204 ?",
      "Comment émarger ?",
      "Procédure d'accès au campus",
      "Comment fonctionne le paiement ?",
      "Où déposer mes documents ?",
      "Contact du secrétariat",
    ],
  },
  {
    key: "greeting",
    utterances: [
      "Bonjour",
      "Salut",
      "Merci",
      "Au revoir",
      "Bonsoir",
      "Hello",
      "Coucou",
      "Merci beaucoup",
    ],
  },
];

// ── Cache des centroïdes ──

let centroidsComputed = false;
let computingPromise: Promise<void> | null = null;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function computeCentroid(vectors: number[][]): number[] {
  const dim = vectors[0].length;
  const centroid = new Array(dim).fill(0);
  for (const vec of vectors) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += vec[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    centroid[i] /= vectors.length;
  }
  return centroid;
}

async function computeAllCentroids(): Promise<void> {
  console.log("[semantic-router] Calcul des centroïdes...");

  for (const route of ROUTES) {
    // Embed toutes les utterances en batch
    const embeddings: number[][] = [];
    for (const utterance of route.utterances) {
      const emb = await generateQueryEmbedding(utterance);
      embeddings.push(emb);
    }
    route.centroid = computeCentroid(embeddings);
  }

  centroidsComputed = true;
  console.log("[semantic-router] Centroïdes calculés pour", ROUTES.length, "routes");
}

async function ensureCentroids(): Promise<void> {
  if (centroidsComputed) return;
  if (!computingPromise) {
    computingPromise = computeAllCentroids().finally(() => {
      computingPromise = null;
    });
  }
  await computingPromise;
}

// ── Routage ──

const CONFIDENCE_THRESHOLD = 0.60;

export interface RouteResult {
  route: RouteKey;
  confidence: number;
}

export async function routeMessage(
  message: string
): Promise<RouteResult> {
  // S'assurer que les centroïdes sont calculés
  await ensureCentroids();

  // Embed la query
  const queryEmbedding = await generateQueryEmbedding(message);

  // Comparer avec chaque centroïde
  let bestRoute: RouteKey = "none";
  let bestScore = -1;

  for (const route of ROUTES) {
    if (!route.centroid) continue;
    const score = cosineSimilarity(queryEmbedding, route.centroid);
    if (score > bestScore) {
      bestScore = score;
      bestRoute = route.key;
    }
  }

  console.log(
    `[semantic-router] "${message.slice(0, 50)}" → ${bestRoute} (${bestScore.toFixed(3)})`
  );

  if (bestScore < CONFIDENCE_THRESHOLD) {
    return { route: "none", confidence: bestScore };
  }

  return { route: bestRoute, confidence: bestScore };
}

// ── Réponses templates (greeting) ──

const GREETING_RESPONSES: Record<string, string> = {
  bonjour:
    "Bonjour ! Je suis l'assistant EasyVacataire. Comment puis-je vous aider ?",
  salut:
    "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
  merci:
    "Je vous en prie ! N'hésitez pas si vous avez d'autres questions.",
  "au revoir":
    "Au revoir et bonne journée !",
  bonsoir:
    "Bonsoir ! Comment puis-je vous aider ?",
  hello:
    "Bonjour ! Comment puis-je vous aider ?",
  coucou:
    "Bonjour ! Que puis-je faire pour vous ?",
};

export function getGreetingResponse(message: string): string {
  const lower = message.toLowerCase().trim();
  for (const [key, response] of Object.entries(GREETING_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  return "Bonjour ! Comment puis-je vous aider ?";
}
