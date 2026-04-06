import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Alias đường dẫn Platform Admin (TASK-05): /dashboard/platform-admin/* → /admin/*
 * /dashboard/platform-admin/system → /admin/health (trạng thái dịch vụ).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/dashboard/platform-admin")) {
    return NextResponse.next();
  }

  const rest = pathname.slice("/dashboard/platform-admin".length) || "/";
  let destination = "/admin";
  if (rest !== "/") {
    if (rest === "/system" || rest.startsWith("/system/")) {
      const tail = rest === "/system" ? "" : rest.slice("/system".length);
      destination = `/admin/health${tail}`;
    } else {
      destination = `/admin${rest}`;
    }
  }

  return NextResponse.redirect(new URL(destination, request.url));
}

export const config = {
  matcher: ["/dashboard/platform-admin", "/dashboard/platform-admin/:path*"],
};
