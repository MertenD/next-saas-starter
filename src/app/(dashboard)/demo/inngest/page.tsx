import { getTranslations } from "next-intl/server";
import { InngestDemoContainer } from "@/features/demo/inngest/components/inngest-demo-container";

export default async function InngestDemoPage() {
  const t = await getTranslations("demo.inngest");

  return (
    <main className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="font-bold text-2xl">{t("heading")}</h1>
        <p className="mt-1 text-muted-foreground text-sm">{t("intro")}</p>
      </div>
      <InngestDemoContainer />
    </main>
  );
}
