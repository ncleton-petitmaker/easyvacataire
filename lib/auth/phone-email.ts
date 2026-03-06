/**
 * Deterministic email mapping for WhatsApp OTP auth.
 * Supabase auth requires an email — we generate a synthetic one from the phone.
 */

export function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `wa_${digits}@univ.internal`;
}

export function emailToPhone(email: string): string {
  const match = email.match(/^wa_(\d+)@univ\.internal$/);
  if (!match) throw new Error(`Not a WhatsApp OTP email: ${email}`);
  return `+${match[1]}`;
}
