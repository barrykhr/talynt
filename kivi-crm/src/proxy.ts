import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Routes reachable without a session. Everything else requires sign-in here,
// and CRM membership is then checked again on the server for every page,
// action and API route (src/lib/auth.ts) — the proxy is not the only gate.
const PUBLIC_PATHS = ["/sign-in", "/access-denied", "/auth/callback", "/api/cron/sync", "/api/health", "/api/public/leads"];

export async function proxy(request: NextRequest) {
  const { response, userId, configured } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!configured && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!userId && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"],
};
