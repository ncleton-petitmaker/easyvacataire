import { sendWhatsAppText } from "@/lib/whatsapp/evolution";

export async function sendOtpViaWhatsApp(
  phone: string,
  code: string
): Promise<void> {
  const text = [
    `Votre code de connexion EasyVacataire : *${code}*`,
    "",
    "Ce code expire dans 5 minutes.",
    "Ne le partagez avec personne.",
  ].join("\n");

  await sendWhatsAppText(phone, text);
}
