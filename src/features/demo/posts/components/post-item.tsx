"use client"

import type { inferRouterOutputs } from "@trpc/server"
import { TrashIcon } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useState } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDeletePost } from "@/features/demo/posts/hooks/use-posts"
import type { AppRouter } from "@/trpc/routers/_app"

/** A post as returned by `trpc.posts.getMany`, so the type can't drift from the router. */
type Post = inferRouterOutputs<AppRouter>["posts"]["getMany"][number]

type PostItemProps = {
  post: Post
}

export function PostItem({ post }: PostItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { mutate: deletePost, isPending } = useDeletePost()
  const t = useTranslations("posts.item")
  const format = useFormatter()

  return (
    <div className="flex items-start justify-between rounded-lg border p-4">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{post.title}</h3>
          {post.published && (
            <Badge variant="secondary">{t("publishedBadge")}</Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {post.content}
        </p>
        <p className="text-xs text-muted-foreground">
          {format.dateTime(post.createdAt, { dateStyle: "medium" })}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        aria-label={t("deleteLabel")}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription", { title: post.title })}
        confirmLabel={t("deleteConfirmLabel")}
        variant="destructive"
        isLoading={isPending}
        onConfirm={() =>
          deletePost(
            { id: post.id },
            { onSuccess: () => setConfirmOpen(false) },
          )
        }
      />
    </div>
  )
}
