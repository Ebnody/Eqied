import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Polled by the verify page after signup to detect when the user has linked
// their Telegram account by sending /start <token> to the bot.
// Accepts both `token` and `userId` for robustness:
//  - `token` works during the active link window (before OTP verification)
//  - `userId` keeps working even after linkToken is cleared

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const userId = req.nextUrl.searchParams.get("userId");

  if (!token && !userId) {
    return NextResponse.json({ linked: false }, { status: 200 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(token ? [{ linkToken: token }] : []),
        ...(userId ? [{ id: userId }] : []),
      ],
    },
    include: { telegramLink: true },
  });

  if (user) {
    return NextResponse.json({
      linked: !!user.telegramLink,
      verified: user.isVerified,
      userId: user.id,
    });
  }

  return NextResponse.json({ linked: false, expired: true }, { status: 200 });
}
