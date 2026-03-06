import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import {
  sendWhatsAppText,
  sendTypingPresence,
} from "@/lib/whatsapp/evolution";
import { runAgent } from "@/lib/ai/mistral";
import { getConversationHistory } from "@/lib/ai/chat-memory";
import { AGENT_TOOLS, createToolExecutor } from "@/lib/ai/agent-tools";

const SYSTEM_PROMPT = `Tu es l'assistant EasyVacataire, un assistant WhatsApp pour les intervenants vacataires en université.

ROLE:
- Aider les intervenants à consulter leur planning de cours
- Permettre de déclarer leurs disponibilités par conversation naturelle
- Répondre aux questions pratiques (campus, salles, procédures administratives)
- Générer des liens vers le calendrier en ligne si l'intervenant préfère

REGLES:
- Réponds toujours en français, de manière concise et bienveillante
- Utilise le vouvoiement
- Formate tes réponses pour WhatsApp (pas de Markdown complexe, utilise *gras* et _italique_)
- Si l'utilisateur donne des disponibilités en langage naturel, utilise l'outil save_disponibilites pour les enregistrer
- Pour les dates relatives ("mardi prochain", "la semaine prochaine"), calcule la date exacte à partir d'aujourd'hui: ${new Date().toISOString().split("T")[0]}
- Quand tu enregistres des dispos, confirme les créneaux enregistrés à l'utilisateur
- Si tu ne peux pas répondre à une question, suggère de contacter le secrétariat

CONTEXTE:
- Les intervenants vacataires ont peu d'heures et ne sont pas toujours sur le campus
- Ils oublient souvent leur emploi du temps et les changements de salle
- Ce bot est leur outil principal de communication avec l'établissement`;

export async function POST(req: NextRequest) {
  try {
    const { phone, text, intervenantId, etablissementId, conversationId } =
      await req.json();

    // Send typing indicator
    await sendTypingPresence(phone);

    let response: string;

    // Check if Mistral API key is configured
    if (process.env.MISTRAL_API_KEY) {
      // LLM agent mode
      const history = conversationId
        ? await getConversationHistory(conversationId)
        : [];

      const toolExecutor = createToolExecutor({
        intervenantId,
        etablissementId,
        phone,
      });

      response = await runAgent({
        systemInstruction: SYSTEM_PROMPT,
        conversationHistory: history,
        userMessage: text,
        tools: AGENT_TOOLS,
        executeTool: toolExecutor,
      });
    } else {
      // Fallback: simple keyword routing (no API key)
      response = await handleFallback(text, intervenantId);
    }

    // Send response via WhatsApp
    const { messageId } = await sendWhatsAppText(phone, response);

    // Store outbound message
    if (conversationId) {
      const supabase = getServiceClient();
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        direction: "outbound",
        content: response,
        whatsapp_message_id: messageId,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[chat-agent] Error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}

// Fallback when no MISTRAL_API_KEY is set
async function handleFallback(
  text: string,
  intervenantId: string
): Promise<string> {
  const supabase = getServiceClient();
  const lowerText = text.toLowerCase().trim();

  if (
    lowerText.includes("planning") ||
    lowerText.includes("cours") ||
    lowerText.includes("creneau") ||
    lowerText.includes("prochain")
  ) {
    const today = new Date().toISOString().split("T")[0];
    const { data: creneaux } = await supabase
      .from("creneaux")
      .select("date, heure_debut, heure_fin, salle, matieres(name)")
      .eq("intervenant_id", intervenantId)
      .eq("status", "confirme")
      .gte("date", today)
      .order("date", { ascending: true })
      .order("heure_debut", { ascending: true })
      .limit(10);

    if (!creneaux || creneaux.length === 0) {
      return "Vous n'avez aucun cours programmé prochainement.";
    }

    const lines = creneaux.map((c) => {
      const matiere =
        (c as Record<string, unknown>).matieres &&
        ((c as Record<string, unknown>).matieres as Record<string, string>)
          ?.name
          ? (
              (c as Record<string, unknown>).matieres as Record<string, string>
            ).name
          : "Cours";
      return `- *${c.date}* de ${c.heure_debut} à ${c.heure_fin} — ${matiere}${c.salle ? ` (salle ${c.salle})` : ""}`;
    });

    return [`*Vos prochains cours :*`, "", ...lines].join("\n");
  }

  if (lowerText.includes("dispo") || lowerText.includes("disponib")) {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return [
      "Pour renseigner vos disponibilités, vous pouvez :",
      "",
      "1. Me dire directement vos dispos (ex: _je suis libre mardi et jeudi après-midi en mars_)",
      `2. Utiliser le calendrier en ligne : ${appUrl}/mes/disponibilites`,
      "",
      "Comment préférez-vous procéder ?",
    ].join("\n");
  }

  return [
    `Bonjour ! Je suis l'assistant EasyVacataire.`,
    "",
    "Je peux vous aider avec :",
    "- *Mon planning* : voir vos prochains cours",
    "- *Mes dispos* : renseigner vos disponibilités",
    "- Poser une question pratique (salle, émargement, etc.)",
    "",
    "Que puis-je faire pour vous ?",
  ].join("\n");
}
