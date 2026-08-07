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
  return useMutation(
    trpc.posts.create.mutationOptions({
      onSuccess: () => {
        toast.success(t("createSuccess"))
        queryClient.invalidateQueries(trpc.posts.getMany.queryOptions())
      },
      onError: (err) => toast.error(err.message),
    }),
  )
}

export const useDeletePost = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const t = useTranslations("posts")
  return useMutation(
    trpc.posts.delete.mutationOptions({
      onSuccess: () => {
        toast.success(t("deleteSuccess"))
        queryClient.invalidateQueries(trpc.posts.getMany.queryOptions())
      },
      onError: (err) => toast.error(err.message),
    }),
  )
}

export const useUpdatePost = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const t = useTranslations("posts")
  return useMutation(
    trpc.posts.update.mutationOptions({
      onSuccess: () => {
        toast.success(t("updateSuccess"))
        queryClient.invalidateQueries(trpc.posts.getMany.queryOptions())
      },
      onError: (err) => toast.error(err.message),
    }),
  )
}
