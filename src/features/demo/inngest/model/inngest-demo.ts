import { CheckCircleIcon, ClockIcon, ZapIcon } from "lucide-react"

export type Run = {
  eventId: string
  /** Kept as a `Date` and formatted at render time, so it follows the active locale. */
  triggeredAt: Date
}

export const JOB_STEPS = [
  {
    id: "fetch-stats",
    label: "fetch-stats",
    descriptionKey: "stepFetchDescription",
    icon: ZapIcon,
  },
  {
    id: "sleep",
    label: "step.sleep",
    descriptionKey: "stepSleepDescription",
    icon: ClockIcon,
  },
  {
    id: "generate-report",
    label: "generate-report",
    descriptionKey: "stepReportDescription",
    icon: CheckCircleIcon,
  },
] as const

/** Local Inngest dev server UI, linked from the demo page. */
export const INNGEST_DASHBOARD_URL = "http://localhost:8288"
