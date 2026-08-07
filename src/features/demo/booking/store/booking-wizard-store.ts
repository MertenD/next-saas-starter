import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  BOOKING_STEPS,
  type BookingStep,
} from "@/features/demo/booking/model/booking";
import type { BookingFormData } from "@/features/demo/booking/schema/booking-schema";

interface BookingWizardState {
  step: BookingStep;
  data: Partial<BookingFormData>;
  setStepData: (patch: Partial<BookingFormData>) => void;
  goToStep: (step: BookingStep) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
}

const INITIAL_STATE: Pick<BookingWizardState, "step" | "data"> = {
  step: BOOKING_STEPS[0],
  data: {},
};

/**
 * Feature-scoped Zustand store for the multi-step booking wizard's current
 * step and accumulated form data. Unlike the global `useUIStore`, this store
 * uses the `persist` middleware backed by `sessionStorage` (not
 * `localStorage`) so an accidental refresh mid-wizard doesn't lose progress,
 * while a booking draft still doesn't outlive the browser tab. Reusable
 * pattern for any other multi-step wizard that needs refresh-safe state.
 */
export const useBookingWizardStore = create<BookingWizardState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      setStepData: (patch) =>
        set((state) => ({ data: { ...state.data, ...patch } })),
      goToStep: (step) => set({ step }),
      next: () =>
        set((state) => {
          const currentIndex = BOOKING_STEPS.indexOf(state.step);
          const nextIndex = Math.min(
            currentIndex + 1,
            BOOKING_STEPS.length - 1,
          );
          return { step: BOOKING_STEPS[nextIndex] };
        }),
      back: () =>
        set((state) => {
          const currentIndex = BOOKING_STEPS.indexOf(state.step);
          const prevIndex = Math.max(currentIndex - 1, 0);
          return { step: BOOKING_STEPS[prevIndex] };
        }),
      reset: () => set(INITIAL_STATE),
    }),
    {
      name: "booking-wizard",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
