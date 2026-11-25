import { DownloadIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * "Download my data" (GDPR access and portability): a plain link to
 * `GET /api/account/export`, which answers with a JSON file. A Server
 * Component, there is nothing to load or fail on the page itself.
 */
export async function DataExportCard() {
  const t = await getTranslations("settings.privacy.export")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" asChild>
          <a href="/api/account/export" download>
            <DownloadIcon />
            {t("button")}
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
