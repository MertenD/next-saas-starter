"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

/**
 * Subscribes to live status updates for a single Inngest job run over
 * Inngest Realtime, instead of polling. The job (see `demoJob` in
 * `src/inngest/functions.ts`) publishes progress as it moves through each
 * step; `refreshToken` fetches a short-lived subscription token per
 * `eventId` from the server since Realtime tokens are scoped/expiring.
 * Reusable pattern for any other job whose progress should stream live to
 * the client rather than being polled.
 */
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
