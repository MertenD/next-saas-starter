import type { Session, User } from "better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isPolarEnabled, polarClient } from "@/lib/polar";

export const requireAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return session;
};

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

export const requireUnauth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/");
  }

  return session;
};

export const getSessionOnServer = async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
};

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
