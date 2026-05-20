import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

const signupSchema = z
  .object({
    fullName: z.string().min(2).max(80),
    phone: z
      .string()
      .trim()
      .regex(/^(?:\+?251|0)?9\d{8}$/, "Invalid Ethiopian phone number")
      .optional()
      .or(z.literal("")),
    telegramUsername: z
      .string()
      .trim()
      .regex(/^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/, "Invalid Telegram username")
      .optional()
      .or(z.literal("")),
    password: z.string().min(8).max(100),
  })
  .refine((d) => !!d.phone || !!d.telegramUsername, {
    message: "Provide a phone number or Telegram username",
    path: ["telegramUsername"],
  });

function normalizePhone(p: string): string {
  const digits = p.replace(/\D/g, "");
  if (digits.startsWith("251")) return `+${digits}`;
  if (digits.startsWith("0")) return `+251${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("9")) return `+251${digits}`;
  return `+${digits}`;
}

function normalizeTelegramUsername(u: string): string {
  return u.replace(/^@/, "").toLowerCase();
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const phone = data.phone ? normalizePhone(data.phone) : null;
  const telegramUsername = data.telegramUsername
    ? normalizeTelegramUsername(data.telegramUsername)
    : null;

  // Check uniqueness
  if (phone) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "Phone number already registered" },
        { status: 409 }
      );
    }
  }
  if (telegramUsername) {
    const existing = await prisma.user.findUnique({
      where: { telegramUsername },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Telegram username already registered" },
        { status: 409 }
      );
    }
  }

  const passwordHash = await hashPassword(data.password);
  const linkToken = randomBytes(24).toString("hex");
  const linkTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName.trim(),
      phone,
      telegramUsername,
      passwordHash,
      linkToken,
      linkTokenExpiresAt,
      settings: { create: {} },
    },
  });

  return NextResponse.json({
    ok: true,
    userId: user.id,
    linkToken,
    botUsername: process.env.TELEGRAM_BOT_USERNAME ?? "",
  });
}
