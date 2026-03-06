/**
 * Tool definitions and executor for the EasyVacataire WhatsApp agent.
 */

import { getServiceClient } from "@/lib/supabase/server";
import type { MistralTool } from "./mistral";
import { randomBytes } from "crypto";
import { searchKnowledge as vectorSearch } from "./embeddings";

// ── Tool definitions ──

export const AGENT_TOOLS: MistralTool[] = [
  {
    type: "function",
    function: {
      name: "get_planning",
      description:
        "Récupère les prochains cours programmés de l'intervenant. Utilise cet outil quand l'utilisateur demande son planning, ses prochains cours, ses créneaux.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_disponibilites",
      description:
        "Récupère les disponibilités actuelles de l'intervenant. Utilise cet outil quand l'utilisateur veut voir ses dispos enregistrées.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_disponibilites",
      description:
        "Enregistre des créneaux de disponibilité pour l'intervenant. Utilise cet outil quand l'utilisateur communique ses disponibilités en langage naturel (ex: 'je suis libre mardi et jeudi après-midi en mars').",
      parameters: {
        type: "object",
        properties: {
          slots: {
            type: "array",
            description: "Liste des créneaux à enregistrer",
            items: {
              type: "object",
              properties: {
                date: {
                  type: "string",
                  description: "Date au format YYYY-MM-DD",
                },
                heure_debut: {
                  type: "string",
                  description: "Heure de début au format HH:MM",
                },
                heure_fin: {
                  type: "string",
                  description: "Heure de fin au format HH:MM",
                },
              },
              required: ["date", "heure_debut", "heure_fin"],
            },
          },
        },
        required: ["slots"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_dispo_link",
      description:
        "Génère un lien vers le calendrier en ligne pour que l'intervenant puisse remplir ses disponibilités visuellement. Utilise quand l'utilisateur préfère le calendrier web.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description:
        "Recherche dans la base de connaissances pratiques (campus, procédures administratives, pédagogie, FAQ). Utilise cet outil pour répondre aux questions pratiques de l'intervenant.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "La question ou les mots-clés à rechercher",
          },
        },
        required: ["query"],
      },
    },
  },
];

// ── Tool executor ──

interface ToolContext {
  intervenantId: string;
  etablissementId: string;
  phone: string;
}

export function createToolExecutor(ctx: ToolContext) {
  const supabase = getServiceClient();

  return async (
    name: string,
    args: Record<string, unknown>
  ): Promise<unknown> => {
    switch (name) {
      case "get_planning":
        return getPlanning(supabase, ctx.intervenantId);

      case "get_disponibilites":
        return getDisponibilites(supabase, ctx.intervenantId);

      case "save_disponibilites":
        return saveDisponibilites(
          supabase,
          ctx.intervenantId,
          ctx.etablissementId,
          args.slots as Array<{
            date: string;
            heure_debut: string;
            heure_fin: string;
          }>
        );

      case "generate_dispo_link":
        return generateDispoLink(supabase, ctx.intervenantId);

      case "search_knowledge":
        return searchKnowledge(supabase, ctx.etablissementId, args.query as string);

      default:
        return { error: `Outil inconnu: ${name}` };
    }
  };
}

// ── Tool implementations ──

async function getPlanning(
  supabase: ReturnType<typeof getServiceClient>,
  intervenantId: string
) {
  const today = new Date().toISOString().split("T")[0];

  const { data: creneaux, error } = await supabase
    .from("creneaux")
    .select("date, heure_debut, heure_fin, salle, matieres(name)")
    .eq("intervenant_id", intervenantId)
    .eq("status", "confirme")
    .gte("date", today)
    .order("date", { ascending: true })
    .order("heure_debut", { ascending: true })
    .limit(10);

  if (error) return { error: error.message };
  if (!creneaux || creneaux.length === 0) {
    return { message: "Aucun cours programmé prochainement." };
  }

  return {
    cours: creneaux.map((c) => ({
      date: c.date,
      heure_debut: c.heure_debut,
      heure_fin: c.heure_fin,
      salle: c.salle || "non définie",
      matiere:
        (c as Record<string, unknown>).matieres &&
        ((c as Record<string, unknown>).matieres as Record<string, string>)?.name
          ? ((c as Record<string, unknown>).matieres as Record<string, string>).name
          : "Cours",
    })),
  };
}

async function getDisponibilites(
  supabase: ReturnType<typeof getServiceClient>,
  intervenantId: string
) {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("disponibilites_intervenant")
    .select("date, heure_debut, heure_fin")
    .eq("intervenant_id", intervenantId)
    .gte("date", today)
    .order("date", { ascending: true })
    .order("heure_debut", { ascending: true });

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { message: "Aucune disponibilité enregistrée." };
  }

  return { disponibilites: data };
}

async function saveDisponibilites(
  supabase: ReturnType<typeof getServiceClient>,
  intervenantId: string,
  etablissementId: string,
  slots: Array<{ date: string; heure_debut: string; heure_fin: string }>
) {
  if (!slots || slots.length === 0) {
    return { error: "Aucun créneau à enregistrer." };
  }

  const rows = slots.map((s) => ({
    intervenant_id: intervenantId,
    etablissement_id: etablissementId,
    date: s.date,
    heure_debut: s.heure_debut,
    heure_fin: s.heure_fin,
  }));

  const { error } = await supabase
    .from("disponibilites_intervenant")
    .insert(rows);

  if (error) return { error: error.message };

  return {
    message: `${slots.length} créneau(x) de disponibilité enregistré(s) avec succès.`,
    slots_saved: slots,
  };
}

async function generateDispoLink(
  supabase: ReturnType<typeof getServiceClient>,
  intervenantId: string
) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Get current metadata
  const { data: intervenant } = await supabase
    .from("intervenants")
    .select("metadata")
    .eq("id", intervenantId)
    .single();

  const metadata = (intervenant?.metadata as Record<string, unknown>) || {};
  metadata.dispo_token = token;
  metadata.dispo_token_expires = expiresAt;

  const { error } = await supabase
    .from("intervenants")
    .update({ metadata })
    .eq("id", intervenantId);

  if (error) return { error: error.message };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    link: `${appUrl}/dispos/${token}`,
    expires: expiresAt,
    message: "Lien valable 7 jours.",
  };
}

async function searchKnowledge(
  supabase: ReturnType<typeof getServiceClient>,
  etablissementId: string,
  query: string
) {
  // Try vector search if Mistral API key is available
  if (process.env.MISTRAL_API_KEY) {
    try {
      const results = await vectorSearch(query, etablissementId, 3);
      if (results.length > 0) {
        // Fetch full knowledge entries for context
        const knowledgeIds = [
          ...new Set(results.map((r) => r.knowledge_id)),
        ];
        const { data: entries } = await supabase
          .from("knowledge_base")
          .select("id, title, category")
          .in("id", knowledgeIds);

        const entriesMap = new Map(
          (entries || []).map((e) => [e.id, e])
        );

        return {
          results: results.map((r) => ({
            title: entriesMap.get(r.knowledge_id)?.title || "",
            content: r.chunk_text,
            category: entriesMap.get(r.knowledge_id)?.category || "",
            similarity: r.similarity,
          })),
        };
      }
    } catch (err) {
      console.error("[search_knowledge] Vector search failed, falling back to text:", err);
    }
  }

  // Fallback: text search (ILIKE)
  const { data, error } = await supabase
    .from("knowledge_base")
    .select("title, content, category")
    .eq("etablissement_id", etablissementId)
    .eq("is_active", true)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .limit(3);

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return {
      message:
        "Je n'ai pas trouvé cette information dans la base de connaissances. Contactez le secrétariat pour plus de détails.",
    };
  }

  return {
    results: data.map((d) => ({
      title: d.title,
      content: d.content,
      category: d.category,
    })),
  };
}
