"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { setLocaleAction } from "@/app/actions/set-locale"
import { authClient } from "@/lib/auth-client"

type LocaleSyncProps = {
  /** `user.locale` from the session (null until the user has a saved preference). */
  userLocale: string | null | undefined
  /** Locale currently active for this request (from the `ui-locale` cookie). */
  activeLocale: string
}

/**
 * Keeps the signed-in user's saved language and the `ui-locale` cookie in
 * sync. Mounted once in the dashboard layout; renders nothing.
 *
 * - User has a saved locale that differs from the cookie (e.g. fresh device,
 *   cleared cookies): apply it to the cookie and refresh so the UI switches.
 * - User has no saved locale yet: store the currently active one, so the
 *   choice follows them to other devices.
 *
 * The language toggle writes both, so afterwards the two always match.
 */
export function LocaleSync({ userLocale, activeLocale }: LocaleSyncProps) {
  const router = useRouter()

  useEffect(() => {
    if (userLocale && userLocale !== activeLocale) {
      setLocaleAction(userLocale).then(() => router.refresh())
      return
    }
    if (!userLocale) {
      authClient.updateUser({ locale: activeLocale })
    }
  }, [userLocale, activeLocale, router])

  return null
}
