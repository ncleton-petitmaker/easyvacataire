import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { handleWebResponse } from "@/lib/demandes/engine";

export async function POST(req: NextRequest) {
  try {
    const { token, accepted } = await req.json();

    if (!token || typeof accepted !== "boolean") {
      return NextResponse.json(
        { error: "token et accepted requis" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    const result = await handleWebResponse(supabase, token, accepted);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("[demandes/respond] Error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
