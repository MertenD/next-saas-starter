"use client";

type Post = {
  id: string;
  title: string;
  content: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

import { TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useDeletePost } from "@/features/demo/posts/hooks/use-posts";

type PostItemProps = {
  post: Post;
};

export function PostItem({ post }: PostItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mutate: deletePost, isPending } = useDeletePost();
  const t = useTranslations("posts.item");

  return (
    <div className="flex items-start justify-between rounded-lg border p-4">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{post.title}</h3>
          {post.published && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
              {t("publishedBadge")}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {post.content}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(post.createdAt).toLocaleDateString()}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
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
  );
}
