import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"

/** The signed-in user's profile data (`trpc.user.me`). Use for anything that needs the current user's name/email/image/etc. */
export const useCurrentUser = () => {
  const trpc = useTRPC()
  return useQuery(trpc.user.me.queryOptions())
}
