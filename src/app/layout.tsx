import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import PlausibleProvider from "next-plausible";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";
import { Toaster } from "sonner";
import { TRPCReactProvider } from "@/trpc/client";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#ff385c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "SaaS Starter",
  description: "A production-ready Next.js SaaS template",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const plausibleSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC;

  const app = (
    <TRPCReactProvider>
      <NuqsAdapter>
        {children}
        <Toaster />
        {process.env.NODE_ENV !== "production" && <ReactQueryDevtools />}
      </NuqsAdapter>
    </TRPCReactProvider>
  );

  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {plausibleSrc ? (
            <PlausibleProvider src={plausibleSrc}>{app}</PlausibleProvider>
          ) : (
            app
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
