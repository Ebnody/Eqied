import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Lightweight endpoint to check if the user is authenticated.
// Used by the client-side AuthSync component to detect missing cookies.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, userId: user.id });
}
