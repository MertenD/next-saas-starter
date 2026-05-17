import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const SUPPORTED = ["en", "de"] as const;
type Locale = (typeof SUPPORTED)[number];

function toLocale(raw: string | undefined): Locale {
  return SUPPORTED.includes(raw as Locale) ? (raw as Locale) : "en";
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = toLocale(cookieStore.get("ui-locale")?.value);
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
