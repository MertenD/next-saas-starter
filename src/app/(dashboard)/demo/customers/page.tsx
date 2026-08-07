import { getTranslations } from "next-intl/server"
import { CustomersContainer } from "@/features/demo/customers/components/customers-container"

export default async function CustomersPage() {
  const t = await getTranslations("customers")

  return (
    <main className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-body-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <CustomersContainer />
    </main>
  )
}
