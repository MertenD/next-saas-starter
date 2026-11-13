import { getTranslations } from "next-intl/server"
import { PostsContainer } from "@/features/demo/posts/components/posts-container"

export default async function PostsPage() {
  const t = await getTranslations("posts")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-body-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <PostsContainer />
    </div>
  )
}
