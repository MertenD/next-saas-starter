import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useTRPC } from "@/trpc/client"

export const usePosts = () => {
  const trpc = useTRPC()
  return useQuery(trpc.posts.getMany.queryOptions())
}

export const useCreatePost = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const t = useTranslations("posts")
  const tErrors = useTranslations("common.errors")
  return useMutation(
    trpc.posts.create.mutationOptions({
      onSuccess: () => {
        toast.success(t("createSuccess"))
      },
      onError: () => toast.error(tErrors("generic")),
      onSettled: () =>
        queryClient.invalidateQueries(trpc.posts.getMany.queryFilter()),
    }),
  )
}

/**
 * Deletes a post with an optimistic update: the post disappears from the
 * cached list immediately and is restored if the request fails. The list is
 * refetched afterwards either way, so the cache converges on the server state.
 */
export const useDeletePost = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const t = useTranslations("posts")
  const tErrors = useTranslations("common.errors")
  return useMutation(
    trpc.posts.delete.mutationOptions({
      onMutate: async ({ id }) => {
        const listKey = trpc.posts.getMany.queryKey()
        await queryClient.cancelQueries({ queryKey: listKey })
        const previous = queryClient.getQueryData(listKey)
        queryClient.setQueryData(listKey, (posts) =>
          posts?.filter((post) => post.id !== id),
        )
        return { previous }
      },
      onSuccess: () => {
        toast.success(t("deleteSuccess"))
      },
      onError: (_error, _input, context) => {
        if (context?.previous) {
          queryClient.setQueryData(
            trpc.posts.getMany.queryKey(),
            context.previous,
          )
        }
        toast.error(tErrors("generic"))
      },
      onSettled: () =>
        queryClient.invalidateQueries(trpc.posts.getMany.queryFilter()),
    }),
  )
}

export const useUpdatePost = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const t = useTranslations("posts")
  const tErrors = useTranslations("common.errors")
  return useMutation(
    trpc.posts.update.mutationOptions({
      onSuccess: () => {
        toast.success(t("updateSuccess"))
      },
      onError: () => toast.error(tErrors("generic")),
      onSettled: () =>
        queryClient.invalidateQueries(trpc.posts.getMany.queryFilter()),
    }),
  )
}
