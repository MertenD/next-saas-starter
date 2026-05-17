import { TRPCError } from "@trpc/server";
import { bookingSchema } from "@/features/demo/booking/schema/booking-schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

// Small artificial delay so the demo's loading state is actually visible.
const SIMULATED_LATENCY_MS = 600;
// Fails often enough to legitimately exercise the Review step's error/retry path.
const SIMULATED_FAILURE_RATE = 0.2;

export const bookingRouter = createTRPCRouter({
  submit: protectedProcedure
    .input(bookingSchema)
    .mutation(async ({ input }) => {
      await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

      if (Math.random() < SIMULATED_FAILURE_RATE) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Payment could not be processed.",
        });
      }

      return {
        confirmationId: crypto.randomUUID(),
        ...input,
      };
    }),
});
