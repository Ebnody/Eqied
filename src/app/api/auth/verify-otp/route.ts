import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  userId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
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

  const { userId, code } = parsed.data;

  const result = await verifyOtp(userId, "signup", code);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason ?? "invalid" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true, linkToken: null, linkTokenExpiresAt: null },
  });

  const token = await createSessionToken(user.id, user.role);
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
