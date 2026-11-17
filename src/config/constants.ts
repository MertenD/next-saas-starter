/** Shared pagination defaults/limits for any paginated list (tRPC list procedures, table hooks, etc.). */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
}

/**
 * The locales the app ships messages for (`messages/<locale>.json`). Single
 * source of truth for the server config (`src/i18n/request.ts`), the locale
 * cookie action (`src/app/actions/set-locale.ts`) and the language switcher.
 * To add a language: extend this list and add the matching messages file.
 */
export const SUPPORTED_LOCALES = ["en", "de"] as const

/** One of {@link SUPPORTED_LOCALES}. */
export type Locale = (typeof SUPPORTED_LOCALES)[number]

/** Locale used when the `ui-locale` cookie is missing or holds an unsupported value. */
export const DEFAULT_LOCALE: Locale = "en"

/** Type guard: narrows an arbitrary string (cookie value, user input) to a {@link Locale}. */
export function isSupportedLocale(value: string | undefined): value is Locale {
  return SUPPORTED_LOCALES.some((locale) => locale === value)
}

/** App-wide display name/description, used in page titles, metadata, and emails. */
export const APP_NAME = "SaaS Starter"
export const APP_DESCRIPTION = "A production-ready Next.js SaaS template"
