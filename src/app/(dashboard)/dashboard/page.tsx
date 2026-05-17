import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth-utils";

export default async function DashboardPage() {
  const session = await requireAuth();
  const t = await getTranslations("dashboard");

  return (
    <main className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("welcome")}, {session.user.name}!
        </p>
      </div>
      <div className="rounded-lg border p-6">
        <p className="text-sm text-muted-foreground">{t("placeholderBody")}</p>
      </div>
    </main>
  );
}
