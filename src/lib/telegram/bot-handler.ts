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

// Inline keyboard builders
function urlButton(text: string, url: string) {
  return { text, url };
}
function callbackButton(text: string, data: string) {
  return { text, callback_data: data };
}
function inlineKeyboard(rows: { text: string; url?: string; callback_data?: string }[][]) {
  return { inline_keyboard: rows };
}

// Reply keyboard builders (persistent bottom buttons)
function webAppButton(text: string, url: string) {
  return { text, web_app: { url } };
}
function textButton(text: string) {
  return { text };
}
function replyKeyboard(rows: { text: string; web_app?: { url: string } }[][], opts?: { resize?: boolean; oneTime?: boolean }) {
  return {
    keyboard: rows,
    resize_keyboard: opts?.resize ?? true,
    one_time_keyboard: opts?.oneTime ?? false,
  };
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
      const dashUrl = buildDashboardUrl();
      const addUrl = buildAppUrl("/income");
      const txUrl = buildTransactionsUrl();
      if (existing.user.isVerified) {
        const keyboard = replyKeyboard([
          dashUrl && addUrl ? [webAppButton("📊 Dashboard", dashUrl), webAppButton("➕ Add", addUrl)] : [],
          txUrl ? [webAppButton("📝 Transactions", txUrl)] : [],
          [textButton("❓ Help"), textButton("🌐 Language")],
        ].filter((r) => r.length > 0));
        await sendTelegramMessage(
          chatId,
          `${t("bot.welcomeBack", { name: existing.user.fullName ?? "" })}`,
          { reply_markup: keyboard }
        );
      } else {
        await sendTelegramMessage(chatId, t("bot.linkedUnverified"));
      }
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
  if (user.isVerified) {
    const dashUrl = buildDashboardUrl();
    const addUrl = buildAppUrl("/income");
    const txUrl = buildTransactionsUrl();
    const keyboard = replyKeyboard([
      dashUrl && addUrl ? [webAppButton("📊 Dashboard", dashUrl), webAppButton("➕ Add", addUrl)] : [],
      txUrl ? [webAppButton("📝 Transactions", txUrl)] : [],
      [textButton("❓ Help"), textButton("🌐 Language")],
    ].filter((r) => r.length > 0));
    await sendTelegramMessage(
      chatId,
      `${t("bot.linkedVerified")}`,
      { reply_markup: keyboard }
    );
  } else {
    await sendTelegramMessage(chatId, t("bot.linkedUnverified"));
  }
}

// Build a deep link to the transactions page so the user can categorize on the web.
function buildAppUrl(path: string = ""): string | null {
  const base = process.env.APP_URL?.replace(/\/$/, "");
  if (!base) {
    console.error("[telegram] APP_URL is not set — cannot build app links");
    return null;
  }
  return path ? `${base}${path}` : base;
}
function buildTransactionsUrl(): string | null {
  return buildAppUrl("/transactions");
}
function buildDashboardUrl(): string | null {
  return buildAppUrl("/dashboard");
}

async function handleTransactionSms(message: TgMessage) {
  const chatId = String(message.chat.id);
  const text = message.text ?? "";

  console.log("[telegram-sms] received text from chat", chatId, "length:", text.length);

  const link = await prisma.telegramLink.findUnique({
    where: { chatId },
    include: { user: true },
  });
  if (!link) {
    console.log("[telegram-sms] no linked user for chat", chatId);
    await sendTelegramMessage(
      chatId,
      "👋 Your Telegram account isn't linked yet. Please sign up at the website first."
    );
    return;
  }
  const user = link.user;

  const parsed = parseTransactionSms(text);
  console.log("[telegram-sms] parsed:", JSON.stringify(parsed));

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
    console.log("[telegram-sms] parse failed or incomplete:", { ok: parsed.ok, amountSantim: parsed.amountSantim, type: parsed.type });
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

  try {
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
    console.log("[telegram-sms] transaction created for user", user.id);
  } catch (err) {
    console.error("[telegram-sms] failed to create transaction:", err);
    await sendTelegramMessage(chatId, "❌ I recognized this SMS but couldn't save the transaction. Please try forwarding it again.");
    return;
  }

  const txUrl = buildTransactionsUrl();
  const dashUrl = buildDashboardUrl();
  const directionEmoji = parsed.type === "income" ? "📥" : "📤";
  const summary = [
    `${directionEmoji} *${parsed.type === "income" ? "Income" : "Expense"} saved*`,
    `Amount: *${formatETB(parsed.amountSantim)}*`,
    parsed.counterparty
      ? `${parsed.type === "income" ? "From" : "To"}: ${parsed.counterparty}`
      : null,
    parsed.reference ? `Ref: ${parsed.reference}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const keyboard = inlineKeyboard([
    txUrl ? [urlButton("📝 Categorize", txUrl)] : [],
    dashUrl ? [urlButton("📊 Dashboard", dashUrl)] : [],
    [callbackButton("❓ Help", "btn:help")],
  ].filter((r) => r.length > 0));

  await sendTelegramMessage(chatId, summary, { parse_mode: "Markdown", reply_markup: keyboard });
}

async function answerCallback(cqId: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (token) {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: cqId }),
    });
  }
}

async function handleCallbackQuery(cq: TgCallbackQuery) {
  await answerCallback(cq.id);
  const chatId = String(cq.message?.chat.id ?? cq.from.id);
  const data = cq.data ?? "";

  if (data === "btn:help") {
    await handleHelpMessage(chatId);
    return;
  }
  if (data === "btn:language") {
    const keyboard = inlineKeyboard([
      [callbackButton("English", "lang:en"), callbackButton("Amharic", "lang:am")],
      [callbackButton("Oromo", "lang:om"), callbackButton("Tigrigna", "lang:ti")],
    ]);
    await sendTelegramMessage(
      chatId,
      "🌐 Choose your preferred language:\n\nCurrent: English",
      { reply_markup: keyboard }
    );
    return;
  }
  if (data.startsWith("lang:")) {
    const locale = data.replace("lang:", "");
    const link = await prisma.telegramLink.findUnique({
      where: { chatId },
      include: { user: true },
    });
    if (link) {
      await prisma.user.update({
        where: { id: link.user.id },
        data: { preferredLocale: locale },
      });
    }
    const names: Record<string, string> = { en: "English", am: "Amharic", om: "Oromo", ti: "Tigrigna" };
    await sendTelegramMessage(chatId, `Language updated to ${names[locale] ?? locale}. Send /start to refresh.`);
    return;
  }
}

async function handleHelpMessage(chatId: string) {
  const dashUrl = buildDashboardUrl();
  const txUrl = buildTransactionsUrl();
  const lines = [
    "❓ *EthioBudget Bot Help*",
    "",
    "*Forward a bank/telebirr SMS* to automatically save it as a transaction.",
    "",
    "*Commands:*",
    "/start - Open main menu",
    "/help - Show this help",
    "",
    dashUrl ? `📊 [Open Dashboard](${dashUrl})` : "",
    txUrl ? `📝 [Categorize Transactions](${txUrl})` : "",
  ];
  await sendTelegramMessage(chatId, lines.filter(Boolean).join("\n"), { parse_mode: "Markdown" });
}

export async function handleTelegramUpdate(update: TgUpdate) {
  if (update.message?.text) {
    const text = update.message.text;

    if (text.startsWith("/start")) {
      await handleStart(update.message);
      return;
    }

    if (text.startsWith("/help")) {
      const chatId = String(update.message.chat.id);
      await handleHelpMessage(chatId);
      return;
    }

    if (text === "❓ Help" || text === "Help") {
      const chatId = String(update.message.chat.id);
      await handleHelpMessage(chatId);
      return;
    }

    if (text === "🌐 Language" || text === "Language") {
      const chatId = String(update.message.chat.id);
      const keyboard = inlineKeyboard([
        [callbackButton("English", "lang:en"), callbackButton("Amharic", "lang:am")],
        [callbackButton("Oromo", "lang:om"), callbackButton("Tigrigna", "lang:ti")],
      ]);
      await sendTelegramMessage(
        chatId,
        "🌐 Choose your preferred language:",
        { reply_markup: keyboard }
      );
      return;
    }

    if (text.startsWith("/")) {
      const chatId = String(update.message.chat.id);
      await sendTelegramMessage(
        chatId,
        "👋 I don't know that command.\n\nTry /start for the menu or /help for assistance.\nYou can also forward a transaction SMS to save it."
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
