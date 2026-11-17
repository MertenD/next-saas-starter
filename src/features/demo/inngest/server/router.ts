import { getSubscriptionToken } from "@inngest/realtime"
import { TRPCError } from "@trpc/server"
import { getJobSubscriptionTokenSchema } from "@/features/demo/inngest/schema/inngest-demo-schema"
import { inngest } from "@/inngest/client"
import { InngestEvents } from "@/inngest/functions"
import { demoJobChannel, demoJobKey } from "@/inngest/realtime"
import { createTRPCRouter, protectedProcedure } from "@/trpc/init"

export const demoRouter = createTRPCRouter({
  triggerDemoJob: protectedProcedure.mutation(async ({ ctx }) => {
    const { ids } = await inngest.send({
      name: InngestEvents.DemoTriggered,
      data: { triggeredBy: ctx.auth.user.email, userId: ctx.auth.user.id },
    })
    const eventId = ids[0]
    if (!eventId) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Inngest did not return an event id.",
      })
    }
    return { eventId }
  }),

  // Issues a short-lived Realtime subscription token scoped to one run's
  // channel, so the client can stream status updates instead of polling. The
  // channel is derived from the session's user id, so only the user who
  // triggered a run can get a token for it.
  getJobSubscriptionToken: protectedProcedure
    .input(getJobSubscriptionTokenSchema)
    .query(async ({ ctx, input }) => {
      return getSubscriptionToken(inngest, {
        channel: demoJobChannel(demoJobKey(ctx.auth.user.id, input.eventId)),
        topics: ["status"],
      })
    }),
})
