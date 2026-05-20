import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";

// Validates the initData string sent by a Telegram Mini App.
// See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

export interface MiniAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface ValidatedInitData {
  ok: boolean;
  user?: MiniAppUser;
  authDate?: number;
  reason?: string;
}

export function verifyInitData(
  initData: string,
  botToken: string,
  maxAgeSec = 24 * 60 * 60
): ValidatedInitData {
  if (!initData) return { ok: false, reason: "missing_init_data" };
  if (!botToken) return { ok: false, reason: "missing_bot_token" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, reason: "missing_hash" };
  params.delete("hash");

  // Build data-check-string: sort keys alphabetically, join with newlines
  const entries = [...params.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  // secret_key = HMAC_SHA256("WebAppData", bot_token)
  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) {
    return { ok: false, reason: "bad_hash" };
  }

  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate) return { ok: false, reason: "missing_auth_date" };
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > maxAgeSec) {
    return { ok: false, reason: "expired" };
  }

  let user: MiniAppUser | undefined;
  const userParam = params.get("user");
  if (userParam) {
    try {
      user = JSON.parse(userParam) as MiniAppUser;
    } catch {
      /* ignore parse error */
    }
  }

  return { ok: true, user, authDate };
}

// Resolves the Mini App user to our internal user via the Telegram chatId.
export async function resolveMiniAppUser(initData: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
  const v = verifyInitData(initData, botToken);
  if (!v.ok || !v.user) {
    return { ok: false as const, reason: v.reason ?? "invalid" };
  }

  const chatId = String(v.user.id);
  const link = await prisma.telegramLink.findUnique({
    where: { chatId },
    include: { user: true },
  });
  if (!link) return { ok: false as const, reason: "not_linked" };
  if (!link.user.isVerified) return { ok: false as const, reason: "not_verified" };

  return { ok: true as const, user: link.user, telegramUser: v.user };
}
