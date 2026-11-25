import Link from "next/link"
import { getTranslations } from "next-intl/server"
import type React from "react"
import { LegalLinks } from "@/components/legal-links"

/**
 * Shell for the public legal pages (privacy policy, imprint). They have to be
 * readable without an account, so they live outside `(dashboard)`.
 */
export default async function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [t, tBrand] = await Promise.all([
    getTranslations("legal"),
    getTranslations("auth.layout"),
  ])

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <span className="text-title-md">{tBrand("brand")}</span>
        <Link
          href="/dashboard"
          className="text-body-sm underline underline-offset-4"
        >
          {t("back")}
        </Link>
      </header>
      <div className="flex-1">{children}</div>
      <footer>
        <LegalLinks />
      </footer>
    </div>
  )
}
