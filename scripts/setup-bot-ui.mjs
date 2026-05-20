// Registers the bot's commands list, persistent menu button, and description
// with Telegram. Run once after changing any of those, or whenever APP_URL
// changes (e.g. new Cloudflare tunnel URL).
//
// Usage:  node scripts/setup-bot-ui.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env");

function loadEnv() {
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const key = m[1];
      let value = m[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (err) {
    console.error("Failed to read .env:", err.message);
  }
}
loadEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.APP_URL?.replace(/\/$/, "");

if (!BOT_TOKEN) {
  console.error("ERROR: TELEGRAM_BOT_TOKEN not set in .env");
  process.exit(1);
}
if (!APP_URL) {
  console.error("ERROR: APP_URL not set in .env (must be HTTPS)");
  process.exit(1);
}
if (!/^https:\/\//.test(APP_URL)) {
  console.error(
    "ERROR: APP_URL must start with https:// (Telegram requires HTTPS for Mini Apps)"
  );
  process.exit(1);
}

const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function call(method, body) {
  const res = await fetch(`${TG}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) {
    console.error(`✗ ${method} failed:`, json.description ?? json);
    return false;
  }
  console.log(`✓ ${method}`);
  return true;
}

console.log("Setting up bot UI…\n");

// 1. Commands list — appears when user taps "/" or the menu button.
//    Telegram supports per-language command lists via the language_code field.
const COMMANDS = {
  en: [
    { command: "add", description: "📥 Add a transaction" },
    { command: "help", description: "❓ Show help" },
    { command: "dashboard", description: "📊 Open your dashboard" },
    { command: "language", description: "🌐 Change language" },
    { command: "start", description: "Relink your account" },
  ],
  am: [
    { command: "add", description: "📥 ግብይት ጨምር" },
    { command: "help", description: "❓ እርዳታ" },
    { command: "dashboard", description: "📊 ዳሽቦርድ ክፈት" },
    { command: "language", description: "🌐 ቋንቋ ቀይር" },
    { command: "start", description: "አካውንት እንደገና አገናኝ" },
  ],
  om: [
    { command: "add", description: "📥 Galmee idaali" },
    { command: "help", description: "❓ Gargaarsa" },
    { command: "dashboard", description: "📊 Daashboordii bani" },
    { command: "language", description: "🌐 Afaan jijjiiri" },
    { command: "start", description: "Akkaawuntii walqabsiisi" },
  ],
  ti: [
    { command: "add", description: "📥 ምትሕልላፍ ወስኽ" },
    { command: "help", description: "❓ ሓገዝ" },
    { command: "dashboard", description: "📊 ዳሽቦርድ ክፈት" },
    { command: "language", description: "🌐 ቋንቋ ቀይር" },
    { command: "start", description: "ሕሳብ ኣራኽብ" },
  ],
};
for (const [lang, commands] of Object.entries(COMMANDS)) {
  await call("setMyCommands", {
    commands,
    ...(lang === "en" ? {} : { language_code: lang }),
  });
}

// 2. Persistent menu button (bottom-left of the chat input).
//    Setting it to a Mini App means a single tap opens the Quick Add form.
await call("setChatMenuButton", {
  menu_button: {
    type: "web_app",
    text: "📥 Add",
    web_app: { url: `${APP_URL}/miniapp` },
  },
});

// 3. Bot description (shown on the bot's profile page)
await call("setMyDescription", {
  description:
    "EthioBudget Tracker — track telebirr & bank transactions, plan your monthly budget, and visualize spending in ETB. Forward SMS or tap the menu button to add transactions.",
});

await call("setMyShortDescription", {
  short_description: "Personal budget tracker for Ethiopian users.",
});

console.log("\n✓ Done. Open the bot in Telegram to see the new menu.");
