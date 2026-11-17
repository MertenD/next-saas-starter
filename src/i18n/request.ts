import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"
import { DEFAULT_LOCALE, isSupportedLocale } from "@/config/constants"

/**
 * next-intl server config: resolves the active locale from the `ui-locale`
 * cookie (set by the language toggle, see `src/components/language-toggle.tsx`
 * and `src/app/actions/set-locale.ts`) and loads that locale's messages from
 * `messages/<locale>.json`. Supported locales live in `SUPPORTED_LOCALES`
 * (`src/config/constants.ts`); unknown cookie values fall back to
 * `DEFAULT_LOCALE`.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get("ui-locale")?.value
  const locale = isSupportedLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
