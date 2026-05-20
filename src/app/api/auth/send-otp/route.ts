import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOtpForUser } from "@/lib/otp";
import { sendTelegramMessage } from "@/lib/telegram/send";

const schema = z.object({
  userId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "validation" }, { status: 400 });

  const { userId } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { telegramLink: true },
  });
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!user.telegramLink)
    return NextResponse.json(
      { error: "telegram_not_linked" },
      { status: 400 }
    );

  const code = await createOtpForUser(user.id, "signup");

  const sent = await sendTelegramMessage(
    user.telegramLink.chatId,
    `🔐 Your EthioBudget verification code is:\n\n*${code}*\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
    { parse_mode: "Markdown" }
  );

  if (!sent.ok) {
    return NextResponse.json(
      { error: "telegram_send_failed", details: sent.error },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
