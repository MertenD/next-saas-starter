import { getTranslations } from "next-intl/server"
import { PostsContainer } from "@/features/demo/posts/components/posts-container"
import { HydrateClient, prefetch, trpc } from "@/trpc/server"

export default async function PostsPage() {
  const t = await getTranslations("posts")
  // Awaited on purpose: with `useQuery` the server HTML must already contain the
  // data. A pending (not awaited) prefetch renders the skeleton on the server
  // while the client hydrates with data, which is a hydration mismatch.
  await prefetch(trpc.posts.getMany.queryOptions())

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-body-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <HydrateClient>
        <PostsContainer />
      </HydrateClient>
    </div>
  )
}
