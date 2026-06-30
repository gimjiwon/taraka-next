import { redirect } from "next/navigation";

/**
 * GET /logout must not clear cookies.
 *
 * Next.js Link prefetch can request GET routes in advance. When logout was a
 * GET route, the visible logout link in the header could be prefetched and the
 * user looked logged out while navigating to other pages. Actual logout now
 * happens only through POST /api/auth/logout from LogoutButton.
 */
export async function GET() {
  redirect("/");
}
