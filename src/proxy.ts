import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "ethiobudget_session";

const PROTECTED_PATHS = [
  "/dashboard",
  "/income",
  "/expenses",
  "/budget",
  "/transactions",
  "/reports",
  "/settings",
];

const AUTH_PATHS = ["/login", "/signup", "/verify"];

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
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isAuthRoute(pathname: string) {
  return AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

async function verifyToken(
  token: string
): Promise<{ userId: string; role?: string } | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 16) return null;
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    if (typeof payload.sub !== "string") return null;
    return { userId: payload.sub, role: payload.role as string | undefined };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdmin = isAdminRoute(pathname);
  const isUser = isUserRoute(pathname);
  const isAuth = isAuthRoute(pathname);

  if (!isAdmin && !isUser && !isAuth) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;

  // Admin routes: require admin role
  if (isAdmin) {
    if (
      !payload ||
      (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, req.url));
    }
  }

  // User routes: redirect admins to admin dashboard
  if (isUser) {
    if (
      payload &&
      (payload.role === "ADMIN" || payload.role === "SUPER_ADMIN")
    ) {
      return NextResponse.redirect(new URL(ADMIN_DASHBOARD, req.url));
    }
    if (!payload) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Auth pages: redirect logged-in users away
  if (isAuth) {
    if (payload) {
      const target =
        payload.role === "ADMIN" || payload.role === "SUPER_ADMIN"
          ? ADMIN_DASHBOARD
          : "/dashboard";
      const url = req.nextUrl.clone();
      url.pathname = target;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/income/:path*",
    "/expenses/:path*",
    "/budget/:path*",
    "/transactions/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/verify",
    "/verify/:path*",
  ],
};
