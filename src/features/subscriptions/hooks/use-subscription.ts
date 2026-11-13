"use client"

import { useQuery } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"
import { useTRPC } from "@/trpc/client"

/**
 * Polar customer state query, keyed by the signed-in user's id so a cached
 * (and IndexedDB-persisted) result can never be served to a different user.
 * Stays disabled until the session (and therefore the user id) is known.
 */
function useCustomerStateQuery(enabled: boolean) {
  const { data: session } = authClient.useSession()
  const userId = session?.user.id

  const query = useQuery({
    queryKey: ["subscription", userId],
    queryFn: async () => {
      const { data } = await authClient.customer.state()
      return data
    },
    enabled: enabled && !!userId,
  })

  return { ...query, isSessionPending: !userId }
}

/** Raw Polar customer state (subscriptions, entitlements, ...) for the signed-in user. Prefer {@link useHasActiveSubscription} for simple premium checks. */
export const useSubscription = () => {
  const { isSessionPending: _isSessionPending, ...query } =
    useCustomerStateQuery(true)
  return query
}

/**
 * The standard client-side premium-gating hook: resolves whether the
 * signed-in user has an active Polar subscription. When Polar isn't
 * configured (`trpc.user.isPolarEnabled` is false), every user is treated
 * as premium so demos/dev environments work without billing set up - mirrors
 * the server-side fallback in `premiumProcedure` (`src/trpc/init.ts`) and
 * `requireAuthAndPremium` (`src/lib/auth-utils.ts`). Use this to
 * conditionally render premium UI; use the server-side guards to actually
 * enforce access.
 */
export const useHasActiveSubscription = () => {
  const trpc = useTRPC()
  const { data: polarEnabled } = useQuery(
    trpc.user.isPolarEnabled.queryOptions(),
  )

  const {
    data: customerState,
    isLoading,
    isSessionPending,
    ...rest
  } = useCustomerStateQuery(polarEnabled === true)

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
    // The query is disabled until the session is known, so treat that as loading too
    isLoading: isLoading || isSessionPending,
    ...rest,
  }
}
