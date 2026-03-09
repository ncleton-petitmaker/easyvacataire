import { getServiceClient } from "@/lib/supabase/server";

export type BusySlot = { start: string; end: string };

const SCOPES = "https://www.googleapis.com/auth/calendar.freebusy";

export function getGoogleAuthUrl(intervenantId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: intervenantId,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    }).toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }
  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>;
}

export async function getValidAccessToken(
  intervenantId: string
): Promise<string | null> {
  const supabase = getServiceClient();
  const { data: row } = await supabase
    .from("google_oauth_tokens")
    .select("*")
    .eq("intervenant_id", intervenantId)
    .maybeSingle();

  if (!row) return null;

  // Token still valid (with 5 min margin)
  if (new Date(row.token_expires_at) > new Date(Date.now() + 5 * 60 * 1000)) {
    return row.access_token;
  }

  // Refresh
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: row.refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }).toString(),
  });

  if (!res.ok) {
    console.error("[google-calendar] Token refresh failed:", await res.text());
    return null;
  }

  const data = await res.json();
  await supabase
    .from("google_oauth_tokens")
    .update({
      access_token: data.access_token,
      token_expires_at: new Date(
        Date.now() + data.expires_in * 1000
      ).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("intervenant_id", intervenantId);

  return data.access_token;
}

export async function fetchFreeBusy(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<BusySlot[]> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/freeBusy",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        timeZone: "Europe/Paris",
        items: [{ id: "primary" }],
      }),
    }
  );

  if (!res.ok) {
    console.error("[google-calendar] FreeBusy failed:", await res.text());
    return [];
  }

  const data = await res.json();
  return data.calendars?.primary?.busy || [];
}

export async function revokeGoogleTokens(
  intervenantId: string
): Promise<void> {
  const supabase = getServiceClient();
  const { data: row } = await supabase
    .from("google_oauth_tokens")
    .select("access_token")
    .eq("intervenant_id", intervenantId)
    .maybeSingle();

  if (row) {
    // Revoke at Google (best effort)
    await fetch(
      `https://oauth2.googleapis.com/revoke?token=${row.access_token}`,
      { method: "POST" }
    ).catch(() => {});

    await supabase
      .from("google_oauth_tokens")
      .delete()
      .eq("intervenant_id", intervenantId);
  }
}
