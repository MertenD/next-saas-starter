"use client"

import { useQuery } from "@tanstack/react-query"
import { useDashboard } from "@/components/dashboard-context"
import { authClient } from "@/lib/auth-client"

/**
 * Polar customer state query, keyed by the signed-in user's id so a cached
 * (and IndexedDB-persisted) result can never be served to a different user.
 * The user id comes from the server-resolved dashboard context, so the query
 * can start immediately without waiting for a client-side session request.
 */
function useCustomerStateQuery(enabled: boolean) {
  const { user } = useDashboard()

  return useQuery({
    queryKey: ["subscription", user.id],
    queryFn: async () => {
      const { data } = await authClient.customer.state()
      return data
    },
    enabled,
  })
}

/** Raw Polar customer state (subscriptions, entitlements, ...) for the signed-in user. Prefer {@link useHasActiveSubscription} for simple premium checks. */
export const useSubscription = () => useCustomerStateQuery(true)

/**
 * The standard client-side premium-gating hook: resolves whether the
 * signed-in user has an active Polar subscription. When Polar isn't
 * configured (`polarEnabled` in the dashboard context is false), every user
 * is treated as premium so demos/dev environments work without billing set
 * up - mirrors the server-side fallback in `premiumProcedure`
 * (`src/trpc/init.ts`) and `requireAuthAndPremium` (`src/lib/auth-utils.ts`).
 * Use this to conditionally render premium UI; use the server-side guards to
 * actually enforce access.
 */
export const useHasActiveSubscription = () => {
  const { polarEnabled } = useDashboard()

  const {
    data: customerState,
    isLoading,
    ...rest
  } = useCustomerStateQuery(polarEnabled)

  // When Polar is not configured, all users are treated as premium (dev/mock mode)
  if (!polarEnabled) {
    return {
      hasActiveSubscription: true,
      subscription: undefined,
      isLoading: false,
      ...rest,
    }
  }

  const hasActiveSubscription =
    customerState?.activeSubscriptions &&
    customerState.activeSubscriptions.length > 0

  return {
    hasActiveSubscription,
    subscription: customerState?.activeSubscriptions?.[0],
    isLoading,
    ...rest,
  }
}
