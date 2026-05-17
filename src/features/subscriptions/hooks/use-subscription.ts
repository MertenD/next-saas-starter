"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";

export const useSubscription = () => {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data } = await authClient.customer.state();
      return data;
    },
  });
};

export const useHasActiveSubscription = () => {
  const trpc = useTRPC();
  const { data: polarEnabled } = useQuery(
    trpc.user.isPolarEnabled.queryOptions(),
  );

  const {
    data: customerState,
    isLoading,
    ...rest
  } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data } = await authClient.customer.state();
      return data;
    },
    // Only run when Polar is configured
    enabled: polarEnabled === true,
  });

  // When Polar is not configured, all users are treated as premium (dev/mock mode)
  if (!polarEnabled) {
    return {
      hasActiveSubscription: true,
      subscription: undefined,
      isLoading: false,
      ...rest,
    };
  }

  const hasActiveSubscription =
    customerState?.activeSubscriptions &&
    customerState.activeSubscriptions.length > 0;

  return {
    hasActiveSubscription,
    subscription: customerState?.activeSubscriptions?.[0],
    isLoading,
    ...rest,
  };
};
