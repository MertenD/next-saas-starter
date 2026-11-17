"use client"

import { FileTextIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { ErrorView } from "@/components/entity-components"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { usePosts } from "@/features/demo/posts/hooks/use-posts"
import { PostCreateDialog } from "./post-create-dialog"
import { PostItem } from "./post-item"

export function PostsContainer() {
  const { data: posts, isLoading, isError, refetch } = usePosts()
  const t = useTranslations("posts")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">{t("title")}</h2>
        <PostCreateDialog />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => i).map((i) => (
            <Skeleton key={`post-skeleton-${i}`} className="h-20 w-full" />
          ))}
        </div>
      )}

      {isError && !posts && (
        <ErrorView message={t("loadError")} onRetry={() => refetch()} />
      )}

      {posts && posts.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
            <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <PostCreateDialog />
          </EmptyContent>
        </Empty>
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
