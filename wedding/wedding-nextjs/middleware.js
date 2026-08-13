import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === "/dashboard/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    const cookie = request.cookies.get("dash_auth")?.value;
    const expected = process.env.DASHBOARD_PASSWORD;

    if (!expected || cookie !== expected) {
      const loginUrl = new URL("/dashboard/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
