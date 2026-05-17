import { getSubscriptionToken } from "@inngest/realtime";
import { z } from "zod";
import { inngest } from "@/inngest/client";
import { InngestEvents } from "@/inngest/functions";
import { demoJobChannel } from "@/inngest/realtime";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const demoRouter = createTRPCRouter({
  triggerDemoJob: protectedProcedure.mutation(async ({ ctx }) => {
    const { ids } = await inngest.send({
      name: InngestEvents.DemoTriggered,
      data: { triggeredBy: ctx.auth.user.email },
    });
    return { eventId: ids[0] };
  }),

  // Issues a short-lived Realtime subscription token scoped to one run's
  // channel, so the client can stream status updates instead of polling.
  getJobSubscriptionToken: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return getSubscriptionToken(inngest, {
        channel: demoJobChannel(input.eventId),
        topics: ["status"],
      });
    }),
});
