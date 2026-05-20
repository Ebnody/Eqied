// Lightweight Telegram message sender. Uses raw HTTP so it can be called from
// anywhere (API routes, server actions) without instantiating a bot.

const TELEGRAM_API = "https://api.telegram.org/bot";

interface SendMessageOptions {
  parse_mode?: "Markdown" | "MarkdownV2" | "HTML";
  reply_markup?: unknown;
  disable_web_page_preview?: boolean;
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options: SendMessageOptions = {}
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("[telegram] TELEGRAM_BOT_TOKEN is not set");
    return { ok: false, error: "missing_token" };
  }

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...options,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[telegram] sendMessage failed:", res.status, body);
      return { ok: false, error: `http_${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[telegram] sendMessage error:", err);
    return { ok: false, error: "network" };
  }
}

export async function setTelegramWebhook(url: string, secretToken?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "missing_token" };

  const res = await fetch(`${TELEGRAM_API}${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      secret_token: secretToken,
      allowed_updates: ["message", "callback_query"],
    }),
  });
  return { ok: res.ok };
}

export interface BotCommand {
  command: string;
  description: string;
}

export async function setBotCommands(commands: BotCommand[]) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "missing_token" };

  const res = await fetch(`${TELEGRAM_API}${token}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commands }),
  });
  return { ok: res.ok };
}

// Sets the persistent menu button (bottom-left of chat input).
// Set to a Mini App so users can open Quick Add with a single tap.
export async function setChatMenuButton(opts: {
  type: "default" | "commands" | "web_app";
  text?: string;
  webAppUrl?: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "missing_token" };

  const menu_button =
    opts.type === "web_app"
      ? {
          type: "web_app",
          text: opts.text ?? "Add",
          web_app: { url: opts.webAppUrl! },
        }
      : opts.type === "commands"
        ? { type: "commands" }
        : { type: "default" };

  const res = await fetch(`${TELEGRAM_API}${token}/setChatMenuButton`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ menu_button }),
  });
  return { ok: res.ok };
}

export async function setBotDescription(description: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "missing_token" };

  const res = await fetch(`${TELEGRAM_API}${token}/setMyDescription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  return { ok: res.ok };
}
