# Login Session Fix

This patch changes login to use the Supabase browser client so the browser stores the Supabase auth session cookie correctly.
It also sends an Authorization bearer token on purchase-related API calls as a fallback.

After deployment, log out and log in again before testing purchase flow.
