import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import PlausibleProvider from "next-plausible"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import type React from "react"
import { Toaster } from "sonner"
import { PwaRegister } from "@/components/pwa-register"
import { APP_DESCRIPTION, APP_NAME } from "@/config/constants"
import { TRPCReactProvider } from "@/trpc/client"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const viewport: Viewport = {
  themeColor: "#ff385c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()])
  const plausibleSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC

  const app = (
    <TRPCReactProvider>
      <NuqsAdapter>
        {children}
        <Toaster />
        <PwaRegister />
        {process.env.NODE_ENV !== "production" && <ReactQueryDevtools />}
      </NuqsAdapter>
    </TRPCReactProvider>
  )

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
  )
}
