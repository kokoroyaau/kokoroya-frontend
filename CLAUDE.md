# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
bun dev              # dev server (turbopack), needs backend + redis + postgres running (see kokoroya-backend)
bun run build         # production build
bun start             # serve a production build
bun lint              # eslint
bun format            # prettier --write .
```

No test suite exists in this repo.

Local `.env` needs `NEXT_PUBLIC_API_URL` pointing at the backend (e.g. `http://localhost:8081`, without a
trailing `/v1` — see "API layer" below). It's inlined at build time, so changing it requires a rebuild, not
just a restart.

## Architecture

Next.js App Router, server-first: pages are `async` Server Components that fetch data directly (no client-side
data-fetching layer except `useMutation` for form submits). Three layers, always in this order:

- **`schema/<domain>/*.schema.ts`** — zod schemas + response types, one folder per backend module (auth, branch,
  clock, foodcost, labour, schedule, user).
- **`api/<domain>/index.ts`** — thin wrappers calling `lib/api.ts`'s `api.get/post/put/patch/delete`, one function
  per backend endpoint. Pages and Server Actions call these, never `lib/api.ts` directly.
- **`lib/actions/<domain>.ts`** — `"use server"` Server Actions that call the `api/` layer, used by client
  components (forms, buttons) that need to mutate data.

### API layer (`lib/api.ts`)

All backend calls funnel through `request()`, which:
- reads the JWT from the `auth_token` cookie and the active branch from `selected_branch`, attaches them as
  `Authorization: Bearer` and `X-Branch-ID` headers.
- prefixes every path with `v1/` — the backend mounts all routes under `/v1` (see
  `kokoroya-backend/internal/router/router.go`). `NEXT_PUBLIC_API_URL` must **not** itself end in `/v1`, or every
  request 404s with a doubled `/v1/v1/...`.
- on a `401` with a token present, redirects to `/api/clear-session` (a Route Handler, not straight to
  `/sign-in`) so the stale cookie gets cleared before landing on the sign-in page. This matters because:
  - Next.js forbids mutating cookies during a Server Component render (only Server Actions/Route Handlers can),
    so `lib/api.ts` itself can't clear the cookie when the 401 happens during a page render.
  - `proxy.ts` (the middleware) only checks whether `auth_token` *exists*, not whether it's valid — if the cookie
    were left in place, `/sign-in` would immediately bounce back to `/`, causing an infinite redirect loop.
  - the redirect target inside `/api/clear-session` is set via `res.headers.set("Location", "/sign-in")` (a
    relative path) rather than `NextResponse.redirect(new URL(...))`, because behind the Coolify/Traefik reverse
    proxy the latter resolves to the container's internal host instead of the public domain.
- 401 handling branches on `typeof window` because `api/*` functions are called both from Server Actions/Server
  Components and directly from client-component event handlers (e.g. `employee-row.tsx`); `redirect()` from
  `next/navigation` only works server-side.
- on `!json.success`, throws — but Server Actions (`"use server"`) should **catch this and return
  `{ success, error }` instead of letting it propagate**, since Next.js strips thrown Server Action error
  messages in production builds (shown to the user as a generic minified React error, e.g. #441). See
  `loginAction` in `lib/actions/auth.ts` for the pattern.

### Auth/session flow

- `auth_token` (JWT) and `selected_branch` cookies are httpOnly, set/read via `lib/auth.ts`.
- Session validity is enforced by the Go backend against Redis (see `kokoroya-backend/internal/session`); the
  JWT alone isn't sufficient — a valid-looking token can still be rejected if its Redis session key is gone
  (logout, revocation, or an expired TTL).
- `proxy.ts` gates all non-API routes: no `auth_token` → `/sign-in`; has token but no `selected_branch` (and not
  already on `/select-branch` or `/store`) → `/select-branch`. It does not itself validate the token — that
  happens per-request in `lib/api.ts` via the backend's 401 response.
- Route access within a page is authorized separately via `canAccess(user, page)` (`lib/user.ts`), checked
  against `user.permissions`/`role` fetched from `/v1/me`.

### Route groups

- `app/(app)/` — authenticated app pages sharing `layout.tsx` (fetches current user + branches, renders the
  sidebar). Each page under here typically does its own `canAccess()` check and `redirect("/")` if unauthorized.
- `app/sign-in`, `app/select-branch`, `app/clock-in` — standalone routes outside the `(app)` layout.
- `app/api/clear-session` — the only Route Handler; exists solely to clear auth cookies (see above).
