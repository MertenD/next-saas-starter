import { z } from "zod"

export const getJobSubscriptionTokenSchema = z.object({
  eventId: z.string(),
})

export type GetJobSubscriptionTokenInput = z.infer<
  typeof getJobSubscriptionTokenSchema
>
