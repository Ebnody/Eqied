import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LOCALES, LOCALE_COOKIE } from "@/i18n/config";

const schema = z.object({
  locale: z.enum(LOCALES),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const { locale } = parsed.data;

  // Always set the cookie so anonymous users can switch locale too.
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  // If logged in, also persist to the user's profile so the bot picks it up.
  try {
    const user = await getCurrentUser();
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { preferredLocale: locale },
      });
    }
  } catch {
    /* anonymous user — cookie is enough */
  }

  return NextResponse.json({ ok: true, locale });
}
