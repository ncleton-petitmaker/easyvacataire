import { NextRequest, NextResponse } from "next/server";
import { sendRemindersForDate } from "@/lib/whatsapp/notifications";

/**
 * Cron endpoint for sending course reminders.
 * Call daily: sends J-1 (tomorrow) and J-0 (today) reminders.
 * Protected by CRON_SECRET header.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    await Promise.all([
      sendRemindersForDate(todayStr, "j-0"),
      sendRemindersForDate(tomorrowStr, "j-1"),
    ]);

    return NextResponse.json({
      ok: true,
      reminded: { today: todayStr, tomorrow: tomorrowStr },
    });
  } catch (error) {
    console.error("[cron/reminders] Error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
