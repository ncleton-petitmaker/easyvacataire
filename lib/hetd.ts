// Taux officiels vacataires (janvier 2025)
export type SessionType = "CM" | "TD" | "TP";

export const HETD_MULT: Record<SessionType, number> = { CM: 1.5, TD: 1, TP: 2 / 3 };
export const TARIF_BRUT: Record<SessionType, number> = { CM: 65.25, TD: 43.50, TP: 29.0 };
export const PLAFOND_HETD = 187;

export function getHeTD(type: string, hours: number): number {
  const mult = HETD_MULT[type as SessionType] ?? 1;
  return hours * mult;
}

export function getMontantBrut(type: string, hours: number): number {
  const tarif = TARIF_BRUT[type as SessionType] ?? 43.5;
  return hours * tarif;
}
