import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "ethiobudget_session";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET is missing or too short.");
  }
  return new TextEncoder().encode(secret);
}

async function verifyToken(
  token: string
): Promise<{ userId: string; role?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (typeof payload.sub !== "string") return null;
    return { userId: payload.sub, role: payload.role as string | undefined };
  } catch {
    return null;
  }
}

const ADMIN_LOGIN = "/admin/login";
const ADMIN_CHANGE_PASSWORD = "/admin/change-password";
const ADMIN_DASHBOARD = "/admin/dashboard";

function isAdminRoute(pathname: string) {
  return (
    pathname.startsWith("/admin") &&
    pathname !== ADMIN_LOGIN &&
    pathname !== ADMIN_CHANGE_PASSWORD
  );
}

function isUserRoute(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/budget") ||
    pathname.startsWith("/income") ||
    pathname.startsWith("/expenses") ||
    pathname.startsWith("/groups") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;

  // Admin routes: require admin role
  if (isAdminRoute(pathname)) {
    if (
      !payload ||
      (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url));
    }
  }

  // User routes: redirect admins to admin dashboard
  if (isUserRoute(pathname)) {
    if (
      payload &&
      (payload.role === "ADMIN" || payload.role === "SUPER_ADMIN")
    ) {
      return NextResponse.redirect(new URL(ADMIN_DASHBOARD, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/transactions/:path*",
    "/budget/:path*",
    "/income/:path*",
    "/expenses/:path*",
    "/groups/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
