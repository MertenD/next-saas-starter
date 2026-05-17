"use server";

import { cookies } from "next/headers";

const SUPPORTED = ["en", "de"];

export async function setLocaleAction(locale: string): Promise<void> {
  if (!SUPPORTED.includes(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set("ui-locale", locale, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearLocaleAction(): Promise<void> {
  (await cookies()).delete("ui-locale");
}
