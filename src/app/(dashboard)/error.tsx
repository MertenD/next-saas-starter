"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { ErrorView } from "@/components/entity-components"

/**
 * Route-level error boundary for `(dashboard)` pages: keeps the sidebar shell
 * alive and shows a plain-language error with a retry action. Reports the
 * error to Sentry (no-op when Sentry is not configured).
 */
export default function DashboardError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="p-6">
      <ErrorView onRetry={retry} />
    </main>
  )
}
