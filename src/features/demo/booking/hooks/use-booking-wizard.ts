"use client"

import { useBookingWizardStore } from "@/features/demo/booking/store/booking-wizard-store"

export function useBookingWizard() {
  const step = useBookingWizardStore((s) => s.step)
  const data = useBookingWizardStore((s) => s.data)
  const setStepData = useBookingWizardStore((s) => s.setStepData)
  const goToStep = useBookingWizardStore((s) => s.goToStep)
  const next = useBookingWizardStore((s) => s.next)
  const back = useBookingWizardStore((s) => s.back)
  const reset = useBookingWizardStore((s) => s.reset)

  /** Removes the persisted draft from `sessionStorage` (e.g. after a successful booking) without touching the in-memory state. */
  const clearDraft = () => useBookingWizardStore.persist.clearStorage()

  return { step, data, setStepData, goToStep, next, back, reset, clearDraft }
}
