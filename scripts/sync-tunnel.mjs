// Read the cloudflared log, find the latest trycloudflare URL,
// rewrite APP_URL in .env, and call Telegram setWebhook.
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  const envPath = path.resolve(".env");
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

const log = fs.readFileSync("tools/tunnel.log", "utf8");
const matches = [...log.matchAll(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/g)];
if (!matches.length) {
  console.error("No trycloudflare URL found in tools/tunnel.log");
  process.exit(1);
}
const newUrl = matches[matches.length - 1][0];
console.log("New tunnel URL:", newUrl);

// 1. Rewrite .env APP_URL
const envPath = path.resolve(".env");
let env = fs.readFileSync(envPath, "utf8");
const appUrlLine = `APP_URL=${newUrl}`;
if (/^APP_URL=.*$/m.test(env)) {
  env = env.replace(/^APP_URL=.*$/m, appUrlLine);
} else {
  env = env.trimEnd() + `\n${appUrlLine}\n`;
}
fs.writeFileSync(envPath, env, "utf8");
console.log("Updated APP_URL in .env");

// Reload env for our own process
const e = loadEnv();
const token = e.TELEGRAM_BOT_TOKEN;
const secret = e.TELEGRAM_WEBHOOK_SECRET;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN missing");
  process.exit(1);
}

// 2. setWebhook
const webhookUrl = `${newUrl}/api/telegram/webhook`;
const params = new URLSearchParams({
  url: webhookUrl,
  drop_pending_updates: "true",
  allowed_updates: JSON.stringify(["message", "callback_query"]),
});
if (secret) params.set("secret_token", secret);

const res = await fetch(
  `https://api.telegram.org/bot${token}/setWebhook?${params.toString()}`
);
const json = await res.json();
console.log("\n[setWebhook]");
console.log(JSON.stringify(json, null, 2));

if (!json.ok) process.exit(1);

console.log("\n✅ Webhook updated. Now restart `npm run dev` so the app picks up the new APP_URL.");
