import { useTranslations } from "next-intl"

type ErrorLike = { message?: string; status?: number }

/**
 * Returns a function that turns a Better Auth / fetch error into text that is
 * safe to show to users and never empty. Server errors (status >= 500, e.g.
 * the database is down) always map to the generic translated message
 * (`common.errors.generic`) instead of leaking technical text like "Internal
 * Server Error". For other errors the server's message is used (e.g. "Invalid
 * email or password"); Better Auth's `error.message` is an empty string when
 * the body isn't JSON, which also falls back to the generic message.
 * Used by the auth forms and the Better Auth mutation hooks.
 */
export function useErrorMessage() {
  const t = useTranslations("common.errors")

  return (error?: ErrorLike | null) => {
    if (error?.status && error.status >= 500) return t("generic")
    return error?.message?.trim() || t("generic")
  }
}
