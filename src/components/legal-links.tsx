import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { cn } from "@/lib/utils"

/**
 * Links to the privacy policy and the imprint, shown under the sign-in forms
 * and at the bottom of the legal pages. Both must be reachable without an
 * account. A Server Component.
 */
export async function LegalLinks({ className }: { className?: string }) {
  const t = await getTranslations("legal.links")

  return (
    <nav
      aria-label={t("label")}
      className={cn("flex gap-4 text-body-sm text-muted-foreground", className)}
    >
      <Link href="/privacy" className="underline underline-offset-4">
        {t("privacy")}
      </Link>
      <Link href="/imprint" className="underline underline-offset-4">
        {t("imprint")}
      </Link>
    </nav>
  )
}
