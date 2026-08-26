import { NextResponse } from "next/server";

// Route Handlers (unlike Server Component render) are allowed to mutate
// cookies. Redirecting here instead of straight to /sign-in lets us drop
// the stale/invalid auth cookie in one hop, so proxy.ts doesn't see a
// still-present token on /sign-in and bounce back to "/" (infinite loop).
export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL("/sign-in", request.url));
  // Behind a reverse proxy (Coolify/Traefik), request.url can resolve to
  // the container's internal host (localhost:3000) instead of the public
  // domain. Force the Location header back to a relative path so the
  // browser redirects on the domain it's already on.
  res.headers.set("Location", "/sign-in");
  res.cookies.delete("auth_token");
  res.cookies.delete("selected_branch");
  return res;
}
