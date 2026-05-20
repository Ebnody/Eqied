import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

const loginSchema = z.object({
  identifier: z.string().min(2),
  password: z.string().min(1),
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

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const { identifier, password } = parsed.data;
  const id = identifier.trim();

  const user = looksLikePhone(id)
    ? await prisma.user.findUnique({ where: { phone: normalizePhone(id) } })
    : await prisma.user.findUnique({
        where: { telegramUsername: id.replace(/^@/, "").toLowerCase() },
      });

  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  if (!user.isVerified) {
    return NextResponse.json(
      {
        error: "Account not verified",
        code: "not_verified",
        userId: user.id,
        botUsername: process.env.TELEGRAM_BOT_USERNAME ?? null,
      },
      { status: 403 }
    );
  }

  const token = await createSessionToken(user.id);
  await setSessionCookie(token);

  return NextResponse.json({ ok: true, token });
}
