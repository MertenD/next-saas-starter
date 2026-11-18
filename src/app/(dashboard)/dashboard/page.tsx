import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { requireAuth } from "@/lib/auth-utils"
import { navTitle } from "@/lib/page-metadata"

/** Starting points shown on the dashboard; each key exists under `dashboard.nextSteps`. */
const NEXT_STEPS = [
  { key: "posts", href: "/demo/posts" },
  { key: "ai", href: "/demo/ai" },
  { key: "settings", href: "/settings" },
] as const

export default async function DashboardPage() {
  const [session, t] = await Promise.all([
    requireAuth(),
    getTranslations("dashboard"),
  ])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("welcome", { name: session.user.name })}
        </p>
      </div>
      <section className="flex flex-col gap-4">
        <h2 className="text-display-sm">{t("nextStepsTitle")}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NEXT_STEPS.map(({ key, href }) => (
            <li key={key}>
              <Link
                href={href}
                className="flex h-full flex-col gap-1 rounded-md border p-4 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="text-title-md">
                  {t(`nextSteps.${key}.title`)}
                </span>
                <span className="text-body-sm text-muted-foreground">
                  {t(`nextSteps.${key}.description`)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export const generateMetadata = () => navTitle("dashboard")
