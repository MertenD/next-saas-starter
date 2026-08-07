import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

/**
 * The single HTTP entry point for all tRPC procedures (used by the
 * `httpBatchLink` client in `src/trpc/client.tsx`). New feature routers are
 * registered in `src/trpc/routers/_app.ts`, not here.
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
