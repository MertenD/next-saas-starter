import { RFCDate } from "@polar-sh/sdk/types/rfcdate.js"
import { createLogger } from "@/lib/logging/logger"
import { isPolarEnabled, polarClient } from "@/lib/polar"

const log = createLogger("admin")

/** How many days of Polar data the overview covers. */
const STATS_DAYS = 30

/** How long the Polar request may take before the card shows its error state. */
const POLAR_TIMEOUT_MS = 8000

/** Billing numbers for the admin overview. Money values are in cents (USD). */
export type BillingStats =
  | { status: "disabled" }
  | { status: "error" }
  | {
      status: "ok"
      /** Revenue of the last 30 days. */
      revenue: number
      /** Monthly recurring revenue as of today. */
      mrr: number
      /** Active subscriptions as of today. */
      activeSubscriptions: number
      /** Subscriptions started in the last 30 days. */
      newSubscriptions: number
      /** Subscriptions canceled in the last 30 days. */
      canceledSubscriptions: number
    }

/**
 * Reads revenue, MRR and subscription numbers from the Polar Metrics API (live,
 * nothing is stored locally). Sums (revenue, new, canceled) come from the
 * 30-day totals, point-in-time values (MRR, active subscriptions) from the
 * newest day. Never throws: when Polar is not configured the result is
 * `disabled`, when the call fails it is `error`, so one broken Polar call
 * does not take the whole overview down.
 */
export async function getBillingStats(): Promise<BillingStats> {
  if (!isPolarEnabled || !polarClient) return { status: "disabled" }

  const end = new Date()
  const start = new Date(end.getTime() - (STATS_DAYS - 1) * 24 * 60 * 60 * 1000)

  try {
    const metrics = await polarClient.metrics.get(
      {
        startDate: new RFCDate(start),
        endDate: new RFCDate(end),
        interval: "day",
      },
      { timeoutMs: POLAR_TIMEOUT_MS },
    )
    const today = metrics.periods.at(-1)

    return {
      status: "ok",
      revenue: metrics.totals.revenue,
      mrr: today?.monthlyRecurringRevenue ?? 0,
      activeSubscriptions: today?.activeSubscriptions ?? 0,
      newSubscriptions: metrics.totals.newSubscriptions,
      canceledSubscriptions: metrics.totals.canceledSubscriptions,
    }
  } catch (error) {
    log.error({ err: error }, "Could not load Polar metrics")
    return { status: "error" }
  }
}
