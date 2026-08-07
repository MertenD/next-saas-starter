import { CheckCircleIcon, ClockIcon, ZapIcon } from "lucide-react";

export type Run = {
  eventId: string;
  triggeredAt: string;
};

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
] as const;
