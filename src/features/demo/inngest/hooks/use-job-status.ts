"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

// Streams status updates over Inngest Realtime instead of polling - the
// dev job publishes as it moves through each step (src/inngest/functions.ts).
export function useJobStatus(eventId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useInngestSubscription({
    refreshToken: () =>
      queryClient.fetchQuery(
        trpc.demo.getJobSubscriptionToken.queryOptions({ eventId }),
      ),
    bufferInterval: 300,
  });
}
