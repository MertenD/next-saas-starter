import Link from "next/link"
import { getTranslations } from "next-intl/server"
import type React from "react"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getTranslations("auth.layout")
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          {t("brand")}
        </Link>
        {children}
      </div>
    </div>
  )
}
