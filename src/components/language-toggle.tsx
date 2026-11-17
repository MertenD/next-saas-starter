"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { setLocaleAction } from "@/app/actions/set-locale"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { SUPPORTED_LOCALES } from "@/config/constants"
import { authClient } from "@/lib/auth-client"

/**
 * Locale switcher: first saves the chosen locale on the user profile
 * (`user.locale`, read back by `LocaleSync`), then persists it via
 * `setLocaleAction` (a cookie-writing Server Action, see
 * `src/app/actions/set-locale.ts`), then refreshes the router so the new locale's messages are loaded server-side
 * (see `src/i18n/request.ts`). Extend `SUPPORTED_LOCALES` (`src/config/constants.ts`) when adding a new supported
 * language. While switching, all buttons are disabled and the clicked one
 * shows a `Spinner`.
 */
export function LanguageToggle() {
  const t = useTranslations("settings.general.language")
  const router = useRouter()

  const [isPending, startTransition] = useTransition()
  const [pendingLocale, setPendingLocale] = useState<string | null>(null)

  function handleLocaleChange(locale: string) {
    setPendingLocale(locale)
    // The transition stays pending until the refreshed page has rendered
    startTransition(async () => {
      // Order matters: save on the profile first (so the choice follows the user
      // across devices), then set the cookie. The cookie-writing Server Action
      // re-renders the page, and LocaleSync would revert the cookie if
      // `user.locale` were still the old value at that point (flicker).
      await authClient.updateUser({ locale })
      await setLocaleAction(locale)
      router.refresh()
    })
  }

  return (
    <div className="flex gap-2">
      {SUPPORTED_LOCALES.map((locale) => (
        <Button
          key={locale}
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleLocaleChange(locale)}
        >
          {isPending && pendingLocale === locale && <Spinner />}
          {t(locale)}
        </Button>
      ))}
    </div>
  )
}
