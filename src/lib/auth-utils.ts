import type { Session, User } from "better-auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { isAdminRole } from "@/config/constants"
import { auth } from "@/lib/auth"
import { isPolarEnabled, polarClient } from "@/lib/polar"

/**
 * Reads the current session without redirecting; returns `null` when
 * unauthenticated. Wrapped in `React.cache()` so a layout and its page (or any
 * other server code in the same request) share a single session lookup. All
 * guards below build on it.
 */
export const getSessionOnServer = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
})

/**
 * The Polar customer state (subscriptions, entitlements) of a user, or `null`
 * when Polar isn't configured. Wrapped in `React.cache()` so every guard that
 * checks the subscription during one request (layout, page, tRPC procedures
 * run during SSR prefetch) shares a single Polar API call. Rejects when the
 * Polar API call fails; callers decide whether that means "deny" or "error".
 */
export const getPolarCustomerState = cache(async (userId: string) => {
  if (!isPolarEnabled || !polarClient) return null
  return polarClient.customers.getStateExternal({ externalId: userId })
})

/** The customer state returned by {@link getPolarCustomerState} when Polar is configured. */
export type PolarCustomerState = NonNullable<
  Awaited<ReturnType<typeof getPolarCustomerState>>
>

/** Whether a Polar customer state has at least one active subscription. */
export function hasActiveSubscription(customer: PolarCustomerState) {
  return (customer.activeSubscriptions?.length ?? 0) > 0
}

/**
 * Server Component / Server Action guard: resolves the current session from
 * request headers and redirects to `/login` if there isn't one. Call this at
 * the top of any protected page or layout instead of manually reading
 * `auth.api.getSession`.
 */
export const requireAuth = async () => {
  const session = await getSessionOnServer()

  if (!session) {
    redirect("/login")
  }

  return session
}

/**
 * Server-side guard that additionally requires an active Polar subscription.
 * Redirects to `/login` when unauthenticated, or to `nonPremiumRedirectUrl`
 * (default `/`) when the user has no active subscription. When Polar isn't
 * configured (`isPolarEnabled` is false), the subscription check is skipped
 * so local/dev environments without billing set up still work.
 */
export const requireAuthAndPremium = async (nonPremiumRedirectUrl = "/") => {
  const session = await getSessionOnServer()

  if (!session) {
    redirect("/login")
  }

  // When Polar is not configured, skip the subscription check (dev/mock mode)
  const customer = await getPolarCustomerState(session.user.id)
  if (!customer) {
    return session
  }

  if (!hasActiveSubscription(customer)) {
    redirect(nonPremiumRedirectUrl)
  }

  return session
}

/**
 * Server Component guard for the admin area: redirects to `/login` without a
 * session and to `/dashboard` when the user is not an admin. Used by
 * `src/app/(dashboard)/admin/layout.tsx`; API calls are guarded separately by
 * `adminProcedure` (`src/trpc/init.ts`).
 */
export const requireAdmin = async () => {
  const session = await requireAuth()

  if (!isAdminRole(session.user.role)) {
    redirect("/dashboard")
  }

  return session
}

/**
 * Inverse of {@link requireAuth}: redirects already-authenticated users away
 * from auth-only pages (login, signup, ...) back to `/dashboard`.
 */
export const requireUnauth = async () => {
  const session = await getSessionOnServer()

  if (session) {
    redirect("/dashboard")
  }

  return session
}

/**
 * Route Handler variant of {@link requireAuthAndPremium}: throws a `Response`
 * (401/403) instead of redirecting, since Route Handlers can't use Next.js
 * navigation redirects. Use this inside `route.ts` handlers that need to
 * gate access behind an active subscription (e.g. API endpoints called from
 * client code rather than rendered directly).
 */
export async function requirePremiumUserFromRequest(_req: Request): Promise<{
  session: Session
  user: User
}> {
  const session = await getSessionOnServer()

  if (!session) {
    throw new Response("Unauthorized", { status: 401 })
  }

  // When Polar is not configured, skip the subscription check (dev/mock mode)
  const customer = await getPolarCustomerState(session.user.id)
  if (!customer) {
    return session
  }

  if (!hasActiveSubscription(customer)) {
    throw new Response("Premium required", { status: 403 })
  }

  return session
}
