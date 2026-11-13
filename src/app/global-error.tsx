"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import de from "../../messages/de.json"
import en from "../../messages/en.json"

const MESSAGES = { en: en.globalError, de: de.globalError }

/**
 * Last-resort error boundary: renders when the root layout itself crashes,
 * which means there is no `NextIntlClientProvider` (and no `ui-locale`
 * cookie access - it's httpOnly), so the text is picked from the
 * `globalError` namespace of the messages files using the browser language.
 * Reports the error to Sentry (no-op when Sentry is not configured).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  const lang =
    typeof navigator !== "undefined" && navigator.language.startsWith("de")
      ? "de"
      : "en"
  const t = MESSAGES[lang]

  return (
    <html lang={lang}>
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 22, margin: 0 }}>{t.title}</h1>
        <p style={{ color: "#6a6a6a", margin: 0 }}>{t.description}</p>
        <button
          type="button"
          onClick={reset}
          style={{
            background: "#ff385c",
            color: "#fff",
            border: 0,
            borderRadius: 8,
            padding: "12px 24px",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          {t.retry}
        </button>
      </body>
    </html>
  )
}
