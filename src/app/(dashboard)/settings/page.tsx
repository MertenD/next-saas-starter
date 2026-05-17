import { getTranslations } from "next-intl/server";
import SettingsTabs from "@/features/settings/components/settings-tabs";

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  return (
    <main className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>
      <div className="max-w-2xl">
        <SettingsTabs />
      </div>
    </main>
  );
}
