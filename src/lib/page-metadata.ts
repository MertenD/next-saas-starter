import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

/**
 * Builds a translated page `<title>` from the `sidebar.nav.*` labels
 * (combined with the app name by the root layout's title template). Use it as
 * `export const generateMetadata = () => navTitle("posts")` in dashboard pages.
 */
export async function navTitle(
  key:
    | "dashboard"
    | "posts"
    | "settings"
    | "inngest"
    | "ai"
    | "booking"
    | "pagination",
): Promise<Metadata> {
  const t = await getTranslations("sidebar.nav")
  return { title: t(key) }
}

/** Translated `<title>` for the auth pages, from the `auth.<key>.title` messages. */
export async function authTitle(
  key: "login" | "register" | "forgotPassword" | "resetPassword",
): Promise<Metadata> {
  const t = await getTranslations(`auth.${key}`)
  return { title: t("title") }
}
