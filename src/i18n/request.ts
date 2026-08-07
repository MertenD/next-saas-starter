import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

const SUPPORTED = ["en", "de"] as const
type Locale = (typeof SUPPORTED)[number]

/** Narrows an arbitrary cookie value to a supported locale, defaulting to `"en"`. */
function toLocale(raw: string | undefined): Locale {
  return SUPPORTED.includes(raw as Locale) ? (raw as Locale) : "en"
}

/**
 * next-intl server config: resolves the active locale from the `ui-locale`
 * cookie (set by the language toggle, see `src/components/language-toggle.tsx`
 * and `src/app/actions/set-locale.ts`) and loads that locale's messages from
 * `messages/<locale>.json`. Add a new locale by extending `SUPPORTED` above
 * and adding the matching messages file.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = toLocale(cookieStore.get("ui-locale")?.value)
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
