import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(
  email: string,
  code: string
): Promise<void> {
  const { error } = await resend.emails.send({
    from: "EasyVacataire <noreply@easyvacataire.fr>",
    to: email,
    subject: `${code} — Code de connexion EasyVacataire`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1a1f2e; margin-bottom: 8px;">Code de connexion</h2>
        <p style="color: #666; margin-bottom: 24px;">Utilisez ce code pour vous connecter à EasyVacataire :</p>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1f2e;">${code}</span>
        </div>
        <p style="color: #999; font-size: 13px;">Ce code expire dans 5 minutes.<br>Ne le partagez avec personne.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
