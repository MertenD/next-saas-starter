import { getTranslations } from "next-intl/server"
import { BookingContainer } from "@/features/demo/booking/components/booking-container"
import { requireAuth } from "@/lib/auth-utils"
import { navTitle } from "@/lib/page-metadata"

export default async function BookingPage() {
  await requireAuth()
  const t = await getTranslations("booking")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-body-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <BookingContainer />
    </div>
  )
}

export const generateMetadata = () => navTitle("booking")
