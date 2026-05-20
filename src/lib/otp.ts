import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export function generateOtpCode(): string {
  // 6-digit numeric code
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createOtpForUser(
  userId: string,
  purpose: "signup" | "login" | "reset"
): Promise<string> {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 8);

  // Invalidate previous unused OTPs for the same purpose
  await prisma.otpCode.updateMany({
    where: { userId, purpose, consumed: false },
    data: { consumed: true },
  });

  await prisma.otpCode.create({
    data: {
      userId,
      purpose,
      codeHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  return code;
}

export async function verifyOtp(
  userId: string,
  purpose: "signup" | "login" | "reset",
  code: string
): Promise<{ ok: boolean; reason?: string }> {
  const otp = await prisma.otpCode.findFirst({
    where: { userId, purpose, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return { ok: false, reason: "no_otp" };
  if (otp.expiresAt < new Date()) return { ok: false, reason: "expired" };
  if (otp.attempts >= MAX_ATTEMPTS)
    return { ok: false, reason: "too_many_attempts" };

  const matches = await bcrypt.compare(code, otp.codeHash);

  if (!matches) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "invalid_code" };
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumed: true },
  });

  return { ok: true };
}
