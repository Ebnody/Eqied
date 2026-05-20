import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionToken, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(10),
});

// Allows the client to restore the session cookie from a localStorage token.
// This is needed for Telegram WebViews which don't reliably persist cookies.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const userId = await verifySessionToken(parsed.data.token);
  if (!userId) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  await setSessionCookie(parsed.data.token);
  return NextResponse.json({ ok: true });
}
