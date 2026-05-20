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

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthPage = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!isProtected && !isAuthPage) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  let userId: string | null = null;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
      const { payload } = await jwtVerify(token, secret);
      if (typeof payload.sub === "string") userId = payload.sub;
    } catch {
      userId = null;
    }
  }

  if (isProtected && !userId) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && userId) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
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
