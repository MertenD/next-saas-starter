import type { Session, User } from "better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isPolarEnabled, polarClient } from "@/lib/polar";

/**
 * Server Component / Server Action guard: resolves the current session from
 * request headers and redirects to `/login` if there isn't one. Call this at
 * the top of any protected page or layout instead of manually reading
 * `auth.api.getSession`.
 */
export const requireAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return session;
};

/**
 * Server-side guard that additionally requires an active Polar subscription.
 * Redirects to `/login` when unauthenticated, or to `nonPremiumRedirectUrl`
 * (default `/`) when the user has no active subscription. When Polar isn't
 * configured (`isPolarEnabled` is false), the subscription check is skipped
 * so local/dev environments without billing set up still work.
 */
export const requireAuthAndPremium = async (nonPremiumRedirectUrl = "/") => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // When Polar is not configured, skip the subscription check (dev/mock mode)
  if (!isPolarEnabled || !polarClient) {
    return session;
  }

  const customer = await polarClient.customers.getStateExternal({
    externalId: session.user.id,
  });

  if (
    !customer.activeSubscriptions ||
    customer.activeSubscriptions.length === 0
  ) {
    redirect(nonPremiumRedirectUrl);
  }

  return session;
};

/**
 * Inverse of {@link requireAuth}: redirects already-authenticated users away
 * from auth-only pages (login, signup, ...) back to `/`.
 */
export const requireUnauth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/");
  }

  return session;
};

/** Reads the current session without redirecting; returns `null` when unauthenticated. */
export const getSessionOnServer = async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
};

/**
 * Route Handler variant of {@link requireAuthAndPremium}: throws a `Response`
 * (401/403) instead of redirecting, since Route Handlers can't use Next.js
 * navigation redirects. Use this inside `route.ts` handlers that need to
 * gate access behind an active subscription (e.g. API endpoints called from
 * client code rather than rendered directly).
 */
export async function requirePremiumUserFromRequest(_req: Request): Promise<{
  session: Session;
  user: User;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // When Polar is not configured, skip the subscription check (dev/mock mode)
  if (!isPolarEnabled || !polarClient) {
    return session;
  }

  const customer = await polarClient.customers.getStateExternal({
    externalId: session.user.id,
  });

  if (
    !customer.activeSubscriptions ||
    customer.activeSubscriptions.length === 0
  ) {
    throw new Response("Premium required", { status: 403 });
  }

  return session;
}
