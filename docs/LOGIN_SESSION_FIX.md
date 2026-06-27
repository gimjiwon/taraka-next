# Login Session Fix

This version changes login to a server-side `/api/auth/login` flow so Supabase auth cookies are written for server-rendered pages and API routes.

## What changed

- `app/login/LoginForm.tsx` now posts to `/api/auth/login` instead of signing in only from the browser client.
- `/api/auth/login` signs in through the server Supabase client and writes auth cookies.
- `middleware.ts` refreshes Supabase SSR cookies so route handlers and server components can consistently read the logged-in user.
- Purchase APIs still accept the browser access token when available, but can also authenticate through the Supabase auth cookie.

## Test after deploy

1. Open `/logout`.
2. Open `/login` and log in again.
3. Confirm the header shows logout/my page.
4. Go to a kuji select page and reserve multiple ticket numbers.
5. Confirm it goes to payment instead of returning to login.

## Browser login final fix

The login form now creates a Supabase browser session first with `supabase.auth.signInWithPassword()` and then best-effort synchronizes server cookies through `/api/auth/login`. Purchase APIs read the browser access token from the `Authorization: Bearer ...` header, so ticket reservation no longer depends only on server cookie propagation.
