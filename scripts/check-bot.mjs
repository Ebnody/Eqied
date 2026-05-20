// Quick diagnostic: prints bot identity + current webhook state.
// Usage:  node scripts/check-bot.mjs
import fs from "node:fs";
import path from "node:path";

// Minimal .env loader (no extra deps).
const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.APP_URL ?? "(not set)";
const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "(not set)";
const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "(not set)";

console.log("APP_URL:                 ", appUrl);
console.log("TELEGRAM_BOT_USERNAME:   ", botUsername);
console.log("TELEGRAM_WEBHOOK_SECRET: ", secret === "(not set)" ? "(not set)" : "(set)");
console.log("TELEGRAM_BOT_TOKEN:      ", token ? `${token.slice(0, 6)}…(${token.length} chars)` : "(not set)");

if (!token) {
  console.error("\nTELEGRAM_BOT_TOKEN is missing — bot cannot run.");
  process.exit(1);
}

const api = `https://api.telegram.org/bot${token}`;

async function call(method) {
  const r = await fetch(`${api}/${method}`);
  return r.json();
}

const me = await call("getMe");
console.log("\n[getMe]");
console.log(JSON.stringify(me, null, 2));

const wh = await call("getWebhookInfo");
console.log("\n[getWebhookInfo]");
console.log(JSON.stringify(wh, null, 2));

if (wh?.result) {
  const url = wh.result.url;
  if (!url) {
    console.warn("\n⚠️  No webhook is set. Telegram has nowhere to deliver updates.");
  } else if (!/^https:\/\//.test(url)) {
    console.warn("\n⚠️  Webhook URL is not HTTPS. Telegram will refuse to deliver.");
  } else if (/localhost|127\.0\.0\.1/.test(url)) {
    console.warn("\n⚠️  Webhook URL points at localhost — Telegram cannot reach it. Use a tunnel (ngrok / cloudflared).");
  }
  if (wh.result.last_error_message) {
    console.warn(`\n⚠️  Last delivery error: ${wh.result.last_error_message}`);
  }
  if ((wh.result.pending_update_count ?? 0) > 0) {
    console.warn(`\n⚠️  ${wh.result.pending_update_count} updates pending — Telegram is queuing them but failing to deliver.`);
  }
}
