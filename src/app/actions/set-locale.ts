"use server"

import { cookies } from "next/headers"
import { isSupportedLocale } from "@/config/constants"

/**
 * Persists the user's chosen locale in the `ui-locale` cookie, which
 * `src/i18n/request.ts` reads on every request to pick which message
 * bundle to load. Invoked from `src/components/language-toggle.tsx`.
 * Silently ignores unsupported locale values.
 */
export async function setLocaleAction(locale: string): Promise<void> {
  if (!isSupportedLocale(locale)) return
  const cookieStore = await cookies()
  cookieStore.set("ui-locale", locale, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  })
}

/** Removes the `ui-locale` cookie, falling back to the default locale on the next request. */
export async function clearLocaleAction(): Promise<void> {
  ;(await cookies()).delete("ui-locale")
}
