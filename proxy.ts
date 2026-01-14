import { NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith("/login") ||
                     request.nextUrl.pathname.startsWith("/register");
  
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");

  if (isApiRoute) {
    return NextResponse.next();
  }

  //get session cookie - better auth
  const sessionToken = request.cookies.get("__Secure-better-auth.session_token") || request.cookies.get("better-auth.session_token");
  const hasSession = !!sessionToken?.value;

  if (!hasSession && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && isAuthPage) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
