# Login session fix

This version uses TAKARA's own signed HTTP-only session cookie named `takara_session` after Supabase password verification succeeds.

Why: some browser/Supabase SSR cookie synchronization paths were not consistently visible to server routes on Vercel, causing purchase APIs to think the user was logged out. The custom cookie is signed with the server-only Supabase service role key and is read by server pages and API routes.

Test after deployment:

1. Visit `/logout`.
2. Log in again at `/login`.
3. Open `/api/debug/session`.
4. Confirm `loggedIn: true` and `hasTakaraSessionCookie: true`.
5. Try number selection and payment again.
