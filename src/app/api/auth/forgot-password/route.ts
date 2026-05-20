import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOtpForUser } from "@/lib/otp";
import { sendTelegramMessage } from "@/lib/telegram/send";

const schema = z.object({
  identifier: z.string().min(2),
});

function looksLikePhone(s: string) {
  return /^(?:\+?251|0)?9\d{8}$/.test(s.trim());
}

function normalizePhone(p: string): string {
  const digits = p.replace(/\D/g, "");
  if (digits.startsWith("251")) return `+${digits}`;
  if (digits.startsWith("0")) return `+251${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("9")) return `+251${digits}`;
  return `+${digits}`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const id = parsed.data.identifier.trim();

  const user = looksLikePhone(id)
    ? await prisma.user.findUnique({
        where: { phone: normalizePhone(id) },
        include: { telegramLink: true },
      })
    : await prisma.user.findUnique({
        where: { telegramUsername: id.replace(/^@/, "").toLowerCase() },
        include: { telegramLink: true },
      });

  // Always return a generic success to avoid leaking which accounts exist.
  // But if the account has no Telegram link, we genuinely cannot deliver the OTP,
  // so surface a distinct error so the UI can guide the user.
  if (!user) {
    return NextResponse.json({ ok: true });
  }
  if (!user.telegramLink) {
    return NextResponse.json(
      { error: "telegram_not_linked" },
      { status: 400 }
    );
  }
  if (!user.isVerified) {
    return NextResponse.json(
      { error: "not_verified" },
      { status: 400 }
    );
  }

  const code = await createOtpForUser(user.id, "reset");

  const sent = await sendTelegramMessage(
    user.telegramLink.chatId,
    `🔐 Your EthioBudget password reset code is:\n\n*${code}*\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nIf you did not request this, ignore this message.`,
    { parse_mode: "Markdown" }
  );

  if (!sent.ok) {
    return NextResponse.json(
      { error: "telegram_send_failed", details: sent.error },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, userId: user.id });
}
