// Handles incoming Telegram bot updates (webhook).
// Telegram is ONLY used for:
//  1. /start <linkToken>  → links the Telegram chat to the user account
//  2. OTP delivery (via API route, not webhook)
//  3. Forwarded transaction SMS → saved as uncategorized; user categorizes on the web app

import { prisma } from "../prisma";
import { sendTelegramMessage } from "./send";
import { parseTransactionSms } from "./parsers";
import { formatETB } from "../utils";
import { tForLocale } from "@/i18n/server";
import { DEFAULT_LOCALE, isValidLocale } from "@/i18n/config";

interface TgUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}
interface TgChat {
  id: number;
}
interface TgMessage {
  message_id: number;
  from?: TgUser;
  chat: TgChat;
  text?: string;
}
interface TgCallbackQuery {
  id: string;
  from: TgUser;
  message?: TgMessage;
  data?: string;
}
export interface TgUpdate {
  update_id: number;
  message?: TgMessage;
  callback_query?: TgCallbackQuery;
}

async function handleStart(message: TgMessage) {
  const chatId = String(message.chat.id);
  const text = message.text ?? "";
  const parts = text.trim().split(/\s+/);
  const linkToken = parts[1];

  // Bare /start with no token
  if (!linkToken) {
    const existing = await prisma.telegramLink.findUnique({
      where: { chatId },
      include: { user: true },
    });
    if (existing) {
      const locale = isValidLocale(existing.user.preferredLocale)
        ? existing.user.preferredLocale
        : DEFAULT_LOCALE;
      const t = tForLocale(locale);
      await sendTelegramMessage(
        chatId,
        existing.user.isVerified
          ? `${t("bot.welcomeBack", { name: existing.user.fullName ?? "" })}\n\nUse the EthioBudget website for all features.`
          : t("bot.linkedUnverified")
      );
      return;
    }
    const t = tForLocale(DEFAULT_LOCALE);
    await sendTelegramMessage(chatId, t("bot.welcomeNew"));
    return;
  }

  // /start <token>
  const user = await prisma.user.findUnique({ where: { linkToken } });

  if (!user) {
    const existing = await prisma.telegramLink.findUnique({
      where: { chatId },
      include: { user: true },
    });
    if (existing) {
      await sendTelegramMessage(
        chatId,
        existing.user.isVerified
          ? `👋 You're already linked.`
          : `👋 You're already linked. Go back to the website and click "Send OTP to my Telegram".`
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      "❌ This link is invalid or has already been used. Please sign up again on the website."
    );
    return;
  }

  if (user.linkTokenExpiresAt && user.linkTokenExpiresAt < new Date()) {
    await sendTelegramMessage(
      chatId,
      "⏰ This link has expired. Please sign up again on the website."
    );
    return;
  }

  const tgUser = message.from;

  await prisma.$transaction([
    prisma.telegramLink.deleteMany({
      where: { OR: [{ userId: user.id }, { chatId }] },
    }),
    prisma.telegramLink.create({
      data: {
        userId: user.id,
        chatId,
        username: tgUser?.username ?? null,
        firstName: tgUser?.first_name ?? null,
        lastName: tgUser?.last_name ?? null,
      },
    }),
  ]);

  const locale = isValidLocale(user.preferredLocale)
    ? user.preferredLocale
    : DEFAULT_LOCALE;
  const t = tForLocale(locale);
  await sendTelegramMessage(
    chatId,
    user.isVerified ? t("bot.linkedVerified") : t("bot.linkedUnverified")
  );
}

// Build a deep link to the transactions page so the user can categorize on the web.
function buildTransactionsUrl(): string | null {
  const base = process.env.APP_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/transactions`;
}

async function handleTransactionSms(message: TgMessage) {
  const chatId = String(message.chat.id);
  const text = message.text ?? "";

  const link = await prisma.telegramLink.findUnique({
    where: { chatId },
    include: { user: true },
  });
  if (!link) {
    await sendTelegramMessage(
      chatId,
      "👋 Your Telegram account isn't linked yet. Please sign up at the website first."
    );
    return;
  }
  const user = link.user;

  const parsed = parseTransactionSms(text);

  // Always record the raw SMS for debugging / reprocessing.
  const sms = await prisma.forwardedSms.create({
    data: {
      userId: user.id,
      rawText: text,
      provider: parsed.provider,
      parsedOk: parsed.ok,
      parsedData: JSON.stringify(parsed),
      parserName: parsed.parserName,
    },
  });

  if (!parsed.ok || !parsed.amountSantim || !parsed.type) {
    await sendTelegramMessage(
      chatId,
      `🤔 I couldn't recognize this as a transaction.\n\nYou can add it manually in the EthioBudget app.\n\n_Provider detected:_ ${parsed.provider}`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // Duplicate detection: same reference within last 30 days
  if (parsed.reference) {
    const dup = await prisma.transaction.findFirst({
      where: {
        userId: user.id,
        reference: parsed.reference,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });
    if (dup) {
      await sendTelegramMessage(
        chatId,
        `♻️ This transaction (Ref ${parsed.reference}) was already recorded.`
      );
      return;
    }
  }

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: parsed.type,
      amount: parsed.amountSantim,
      status: "uncategorized",
      source: "telegram",
      paymentMethod: parsed.provider === "telebirr" ? "telebirr" : null,
      provider: parsed.provider,
      counterparty: parsed.counterparty ?? null,
      counterpartyPhone: parsed.counterpartyPhone ?? null,
      reference: parsed.reference ?? null,
      balanceAfter: parsed.balanceAfterSantim ?? null,
      occurredAt: parsed.occurredAt ?? new Date(),
      forwardedSmsId: sms.id,
    },
  });

  const txUrl = buildTransactionsUrl();
  const directionEmoji = parsed.type === "income" ? "📥" : "📤";
  const summary = [
    `${directionEmoji} *${parsed.type === "income" ? "Income" : "Expense"} saved*`,
    `Amount: *${formatETB(parsed.amountSantim)}*`,
    parsed.counterparty
      ? `${parsed.type === "income" ? "From" : "To"}: ${parsed.counterparty}`
      : null,
    parsed.reference ? `Ref: ${parsed.reference}` : null,
    "",
    txUrl
      ? `Open the website to choose a category:\n${txUrl}`
      : "Open the EthioBudget website to choose a category.",
  ]
    .filter(Boolean)
    .join("\n");

  await sendTelegramMessage(chatId, summary, { parse_mode: "Markdown" });
}

async function handleCallbackQuery(cq: TgCallbackQuery) {
  // We no longer use callback queries, but answer them to avoid the
  // "loading..." spinner sticking on old messages.
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (token && cq.id) {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: cq.id }),
    });
  }
}

export async function handleTelegramUpdate(update: TgUpdate) {
  if (update.message?.text) {
    const text = update.message.text;

    if (text.startsWith("/start")) {
      await handleStart(update.message);
      return;
    }

    // Reject any other slash command — those features now live on the website.
    if (text.startsWith("/")) {
      const chatId = String(update.message.chat.id);
      await sendTelegramMessage(
        chatId,
        "👋 Please use the EthioBudget website for all features.\nForward a transaction SMS to save it."
      );
      return;
    }

    // Anything else is treated as a forwarded transaction SMS.
    await handleTransactionSms(update.message);
    return;
  }

  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
  }
}
