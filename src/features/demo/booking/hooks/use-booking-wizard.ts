"use client";

import { useBookingWizardStore } from "@/features/demo/booking/store/booking-wizard-store";

export function useBookingWizard() {
  const step = useBookingWizardStore((s) => s.step);
  const data = useBookingWizardStore((s) => s.data);
  const setStepData = useBookingWizardStore((s) => s.setStepData);
  const goToStep = useBookingWizardStore((s) => s.goToStep);
  const next = useBookingWizardStore((s) => s.next);
  const back = useBookingWizardStore((s) => s.back);
  const reset = useBookingWizardStore((s) => s.reset);

  return { step, data, setStepData, goToStep, next, back, reset };
}
