import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { LEGAL } from "@/config/legal"

/**
 * The imprint, filled from `src/config/legal.ts`. Which fields a legal
 * imprint needs depends on your country and legal form, adjust the fields and
 * this page, and ask a lawyer (see `docs/gdpr.md`).
 */
export default async function ImprintPage() {
  const t = await getTranslations("legal.imprint")

  return (
    <article className="flex flex-col gap-6">
      <h1 className="text-display-lg">{t("title")}</h1>

      <section className="flex flex-col gap-1">
        <h2 className="text-title-md">{t("operator")}</h2>
        <p>{LEGAL.operatorName}</p>
        {LEGAL.addressLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="text-title-md">{t("representative")}</h2>
        <p>{LEGAL.representative}</p>
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="text-title-md">{t("contact")}</h2>
        <p>{LEGAL.contactEmail}</p>
      </section>

      {LEGAL.register && (
        <section className="flex flex-col gap-1">
          <h2 className="text-title-md">{t("register")}</h2>
          <p>{LEGAL.register}</p>
        </section>
      )}

      {LEGAL.vatId && (
        <section className="flex flex-col gap-1">
          <h2 className="text-title-md">{t("vatId")}</h2>
          <p>{LEGAL.vatId}</p>
        </section>
      )}
    </article>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.imprint")
  return { title: t("title") }
}
