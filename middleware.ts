import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

/** Cookie names used by Auth.js v5 / legacy next-auth (รวมแบบแบ่ง chunk .0, .1) */
function hasSessionCookie(req: NextRequest): boolean {
  const sessionCookiePattern =
    /^(?:__Secure-)?(?:authjs|next-auth)\.session-token(?:\.\d+)?$/;
  return req.cookies.getAll().some((c) => sessionCookiePattern.test(c.name));
}

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  const prefixes = [
    "/login",
    "/forget-password",
    "/terms",
    "/notAvailble",
    "/notFound",
    "/issue-report",
  ];
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function middleware(req: NextRequest) {
  if (isPublicPath(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!hasSessionCookie(req)) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}
