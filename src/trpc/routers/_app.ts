import { bookingRouter } from "@/features/demo/booking/server/router";
import { customersRouter } from "@/features/demo/customers/server/router";
import { demoRouter } from "@/features/demo/inngest/server/router";
import { postsRouter } from "@/features/demo/posts/server/router";
import { userRouter } from "@/features/user/server/router";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  posts: postsRouter,
  user: userRouter,
  demo: demoRouter,
  customers: customersRouter,
  booking: bookingRouter,
});

export type AppRouter = typeof appRouter;
