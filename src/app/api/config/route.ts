import { NextResponse } from "next/server";

// Public, client-safe config bits. Currently only the Telegram bot
// username so the login page can build a deep-link for password reset.
export async function GET() {
  return NextResponse.json({
    botUsername: process.env.TELEGRAM_BOT_USERNAME ?? "",
  });
}
