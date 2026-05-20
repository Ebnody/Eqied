import { NextRequest, NextResponse } from "next/server";
import { resolveMiniAppUser } from "@/lib/telegram/webapp-auth";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

// Exchanges a Telegram Mini App initData string for a real session cookie.
// Used by /tg-login to auto-authenticate users who tap a web_app button
// from the bot, so they don't have to manually log in.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const initData = body?.initData;
  if (typeof initData !== "string" || initData.length < 10) {
    return NextResponse.json({ error: "missing_init_data" }, { status: 400 });
  }

  const auth = await resolveMiniAppUser(initData);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: 401 });
  }

  const token = await createSessionToken(auth.user.id);
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
