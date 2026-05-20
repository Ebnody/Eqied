import { NextRequest, NextResponse } from "next/server";
import { handleTelegramUpdate, TgUpdate } from "@/lib/telegram/bot-handler";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Optional secret token check
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== expected) {
      console.error("[telegram-webhook] secret mismatch. expected:", expected, "got:", got);
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  console.log("[telegram-webhook] received update:", JSON.stringify(update, null, 2));

  try {
    await handleTelegramUpdate(update);
  } catch (err) {
    console.error("[telegram-webhook] handler error", err);
  }

  // Always 200 - Telegram retries failed updates indefinitely otherwise
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST Telegram updates here" });
}
