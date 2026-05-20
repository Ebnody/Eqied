import { NextResponse } from "next/server";

const TG_API = "https://api.telegram.org/bot";

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.APP_URL;
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN missing" });
  if (!appUrl) return NextResponse.json({ error: "APP_URL missing" });

  const [meRes, hookRes] = await Promise.all([
    fetch(`${TG_API}${token}/getMe`),
    fetch(`${TG_API}${token}/getWebhookInfo`),
  ]);

  const meData = await meRes.json();
  const hookData = await hookRes.json();

  return NextResponse.json({
    appUrl,
    bot: meData.ok ? meData.result : { error: meData.description },
    webhook: hookData.result ?? { error: hookData.description },
  });
}

export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!token) return NextResponse.json({ error: "missing TELEGRAM_BOT_TOKEN" });

  // Accept optional custom URL in the body, fallback to APP_URL env
  let body: { url?: string } = {};
  try {
    body = (await req.json()) as { url?: string };
  } catch {
    // ignore empty body
  }

  const appUrl = (body.url ?? process.env.APP_URL)?.replace(/\/$/, "");
  if (!appUrl) {
    return NextResponse.json({
      error: "missing APP_URL. Pass { url: 'https://...' } in the body or set APP_URL env.",
    });
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  const res = await fetch(`${TG_API}${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
    }),
  });
  const data = await res.json();
  return NextResponse.json({ ok: res.ok, webhookUrl, data });
}
