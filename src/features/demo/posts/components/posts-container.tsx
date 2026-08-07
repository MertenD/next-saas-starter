"use client"

import { FileTextIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { usePosts } from "@/features/demo/posts/hooks/use-posts"
import { PostCreateDialog } from "./post-create-dialog"
import { PostItem } from "./post-item"

export function PostsContainer() {
  const { data: posts, isLoading, isError } = usePosts()
  const t = useTranslations("posts")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">{t("title")}</h2>
        <PostCreateDialog />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
            <div key={key} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/50 p-4 text-sm text-destructive">
          {t("loadError")}
        </div>
      )}

      {!isLoading && posts?.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <FileTextIcon className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium text-sm">{t("emptyTitle")}</p>
          <p className="text-muted-foreground text-xs">
            {t("emptyDescription")}
          </p>
        </div>
      )}

      {posts && posts.length > 0 && (
        <div className="space-y-2">
          {posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
