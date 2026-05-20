// Registers a webhook URL with the Telegram Bot API.
// Usage: node scripts/set-webhook.mjs https://your-public-host/api/telegram/webhook
// Reads TELEGRAM_BOT_TOKEN and (optional) TELEGRAM_WEBHOOK_SECRET from .env
import { readFileSync } from "node:fs";

function loadEnv(path = ".env") {
  const out = {};
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

const env = loadEnv();
const token = env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN missing in .env");
  process.exit(1);
}

const url = process.argv[2];
if (!url) {
  console.error("Usage: node scripts/set-webhook.mjs <public-https-url>");
  console.error("Example: node scripts/set-webhook.mjs https://abc123.ngrok-free.app/api/telegram/webhook");
  process.exit(1);
}

const body = {
  url,
  allowed_updates: ["message", "callback_query"],
  drop_pending_updates: true,
};
if (env.TELEGRAM_WEBHOOK_SECRET) body.secret_token = env.TELEGRAM_WEBHOOK_SECRET;

const res = await fetch(
  `https://api.telegram.org/bot${token}/setWebhook`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }
);
const json = await res.json();
console.log(JSON.stringify(json, null, 2));
process.exit(json.ok ? 0 : 1);
