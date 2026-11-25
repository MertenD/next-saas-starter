import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { env } from "@/config/env"
import { LEGAL } from "@/config/legal"
import { getEnabledOAuthProviders } from "@/lib/oauth-providers"
import { isPolarEnabled } from "@/lib/polar"
import { isResendEnabled } from "@/lib/resend"

/**
 * The privacy policy (GDPR Art. 13). The text describes what this template
 * really does, and the lists of data and recipients follow the configuration:
 * Polar, Resend, OpenRouter, Sentry, Plausible and the OAuth providers only
 * appear when they are switched on. Operator details come from
 * `src/config/legal.ts`. It is a starting point, not legal advice: when you
 * add features or services, update the messages (`legal.privacy.*`) and
 * `docs/gdpr.md`, and have a lawyer review it before you go live.
 */
export default async function PrivacyPage() {
  const t = await getTranslations("legal.privacy")

  const oauth = getEnabledOAuthProviders()
  const hasPolar = isPolarEnabled
  const hasAi = !!env.OPENROUTER_API_KEY
  const hasSentry = !!process.env.NEXT_PUBLIC_SENTRY_DSN
  const hasPlausible = !!process.env.NEXT_PUBLIC_PLAUSIBLE_SRC

  const dataItems = [
    "account",
    "sessions",
    "content",
    isResendEnabled && "email",
    hasPolar && "billing",
    "logs",
    hasSentry && "errors",
    hasPlausible && "analytics",
    hasAi && "ai",
  ].filter((key): key is string => !!key)

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-display-lg">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-display-sm">{t("controller.title")}</h2>
        <p>
          {t("controller.text", {
            name: LEGAL.operatorName,
            address: LEGAL.addressLines.join(", "),
            email: LEGAL.privacyEmail,
          })}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-display-sm">{t("data.title")}</h2>
        <ul className="list-disc space-y-2 pl-6">
          {dataItems.map((key) => (
            <li key={key}>{t(`data.${key}`)}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-display-sm">{t("recipients.title")}</h2>
        <p>{t("recipients.intro")}</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            {t("recipients.hosting", { provider: LEGAL.hostingProvider })}
          </li>
          {hasPolar && <li>{t("recipients.polar")}</li>}
          {isResendEnabled && <li>{t("recipients.resend")}</li>}
          {hasAi && <li>{t("recipients.openrouter")}</li>}
          {hasSentry && <li>{t("recipients.sentry")}</li>}
          {hasPlausible && <li>{t("recipients.plausible")}</li>}
          {oauth.includes("google") && <li>{t("recipients.google")}</li>}
          {oauth.includes("github") && <li>{t("recipients.github")}</li>}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-display-sm">{t("cookies.title")}</h2>
        <p>{t("cookies.text")}</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>{t("cookies.session")}</li>
          <li>{t("cookies.language")}</li>
          <li>{t("cookies.sidebar")}</li>
          <li>{t("cookies.browser")}</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-display-sm">{t("retention.title")}</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>{t("retention.account")}</li>
          <li>{t("retention.sessions")}</li>
          <li>{t("retention.tokens")}</li>
          {hasPolar && <li>{t("retention.billing")}</li>}
          <li>{t("retention.logs")}</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-display-sm">{t("rights.title")}</h2>
        <p>{t("rights.intro")}</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>{t("rights.access")}</li>
          <li>{t("rights.rectification")}</li>
          <li>{t("rights.erasure")}</li>
        </ul>
        <p>{t("rights.other", { email: LEGAL.privacyEmail })}</p>
        <p>{t("rights.complaint")}</p>
      </section>
    </article>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy")
  return { title: t("title") }
}
