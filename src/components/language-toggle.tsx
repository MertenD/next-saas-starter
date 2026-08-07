"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { setLocaleAction } from "@/app/actions/set-locale";
import { Button } from "@/components/ui/button";

const LOCALES = ["en", "de"] as const;

/**
 * Locale switcher: persists the chosen locale via `setLocaleAction` (a
 * cookie-writing Server Action, see `src/app/actions/set-locale.ts`) and
 * refreshes the router so the new locale's messages are loaded server-side
 * (see `src/i18n/request.ts`). Extend `LOCALES` when adding a new supported
 * language.
 */
export function LanguageToggle() {
  const t = useTranslations("settings.general.language");
  const router = useRouter();

  async function handleLocaleChange(locale: string) {
    await setLocaleAction(locale);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {LOCALES.map((locale) => (
        <Button
          key={locale}
          variant="outline"
          size="sm"
          onClick={() => handleLocaleChange(locale)}
        >
          {t(locale)}
        </Button>
      ))}
    </div>
  );
}
