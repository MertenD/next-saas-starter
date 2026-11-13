"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { setLocaleAction } from "@/app/actions/set-locale"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

const LOCALES = ["en", "de"] as const

/**
 * Locale switcher: persists the chosen locale via `setLocaleAction` (a
 * cookie-writing Server Action, see `src/app/actions/set-locale.ts`) and on
 * the user profile (`user.locale`, read back by `LocaleSync`), then refreshes the router so the new locale's messages are loaded server-side
 * (see `src/i18n/request.ts`). Extend `LOCALES` when adding a new supported
 * language.
 */
export function LanguageToggle() {
  const t = useTranslations("settings.general.language")
  const router = useRouter()

  async function handleLocaleChange(locale: string) {
    await setLocaleAction(locale)
    // Also save it on the profile so the choice follows the user across devices (see LocaleSync)
    await authClient.updateUser({ locale })
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      {LOCALES.map((locale) => (
        <Button
          key={locale}
          variant="outline"
          size="sm"
          onClick={() => handleLocaleChange(locale)}
        >
          {t(locale)}
        </Button>
      ))}
    </div>
  )
}
