"use client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
// ^-- to make sure we can mount the Provider from a server component
import type { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import superjson from "superjson";
import { makeQueryClient } from "./query-client";
import type { AppRouter } from "./routers/_app";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient;
function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return "";
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  })();
  return `${base}/api/trpc`;
}

const noopPersister = {
  persistClient: async () => {},
  restoreClient: async () => undefined as never,
  removeClient: async () => {},
};

const idbPersister =
  typeof window !== "undefined"
    ? createAsyncStoragePersister({
        storage: {
          getItem: async (key: string) => {
            const { get } = await import("idb-keyval");
            return (await get<string>(key)) ?? null;
          },
          setItem: async (key: string, value: string) => {
            const { set } = await import("idb-keyval");
            await set(key, value);
          },
          removeItem: async (key: string) => {
            const { del } = await import("idb-keyval");
            await del(key);
          },
        },
      })
    : noopPersister;

const PERSIST_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: getUrl(),
        }),
      ],
    }),
  );
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: idbPersister, maxAge: PERSIST_MAX_AGE }}
    >
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </PersistQueryClientProvider>
  );
}
