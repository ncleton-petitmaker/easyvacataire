import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken, fetchFreeBusy } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const intervenantId = req.nextUrl.searchParams.get("intervenant_id");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!intervenantId || !from || !to) {
    return NextResponse.json(
      { error: "intervenant_id, from, to requis" },
      { status: 400 }
    );
  }

  const accessToken = await getValidAccessToken(intervenantId);
  if (!accessToken) {
    return NextResponse.json({ connected: false, busy: [] });
  }

  const timeMin = new Date(`${from}T00:00:00+01:00`).toISOString();
  const timeMax = new Date(`${to}T23:59:59+01:00`).toISOString();

  const busy = await fetchFreeBusy(accessToken, timeMin, timeMax);
  return NextResponse.json({ connected: true, busy });
}
