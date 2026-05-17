"use client";

import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/language-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GeneralSettings() {
  const t = useTranslations("settings.general");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("language.label")}</CardTitle>
      </CardHeader>
      <CardContent>
        <LanguageToggle />
      </CardContent>
    </Card>
  );
}
