"use client"

import { useShallow } from "zustand/react/shallow"
import { useBookingWizardStore } from "@/features/demo/booking/store/booking-wizard-store"

/** The current wizard step. Subscribes to the step only, so components that just switch on it don't re-render on data changes. */
export function useBookingStep() {
  return useBookingWizardStore((s) => s.step)
}

/** The accumulated form data of all steps so far. */
export function useBookingData() {
  return useBookingWizardStore((s) => s.data)
}

/** Removes the persisted draft from `sessionStorage` (e.g. after a successful booking) without touching the in-memory state. */
function clearDraft() {
  return useBookingWizardStore.persist.clearStorage()
}

/**
 * The wizard's actions. They never change identity, and `useShallow` keeps the
 * returned object stable, so using this hook never causes a re-render by itself.
 */
export function useBookingActions() {
  const actions = useBookingWizardStore(
    useShallow((s) => ({
      setStepData: s.setStepData,
      goToStep: s.goToStep,
      next: s.next,
      back: s.back,
      reset: s.reset,
    })),
  )

  return { ...actions, clearDraft }
}
