import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { hashPassword } from "@/lib/auth";

const schema = z.object({
  userId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(8).max(100),
});

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

  const { userId, code, newPassword } = parsed.data;

  const result = await verifyOtp(userId, "reset", code);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason ?? "invalid" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
