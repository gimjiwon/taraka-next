# TAKARA no-logout navigation fix

This patch stabilizes login while moving through the Kuji pages.

Changes:
- Keeps the signed TAKARA session cookie.
- Adds a signed backup cookie (`takara_session_backup`) for browsers/routes that fail to preserve the HTTP-only cookie during the current prototype flow.
- Reads either signed cookie in server pages and APIs.
- Simplifies middleware so it no longer refreshes or rewrites Supabase auth cookies on every navigation.
- Forces dynamic rendering at the root layout level to avoid stale login state in navigation.

After deployment:
1. Open `/logout`.
2. Log in again.
3. Open `/api/debug/session`.
4. Confirm `loggedIn: true` and either `hasTakaraSessionCookie` or `hasTakaraBackupCookie` is true.
5. Test `/kuji -> detail -> queue -> select -> payment`.
