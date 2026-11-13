import { getTranslations } from "next-intl/server"
import { BookingContainer } from "@/features/demo/booking/components/booking-container"

export default async function BookingPage() {
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
