"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { BookingProgress } from "@/features/demo/booking/components/booking-progress"
import { BookingStepDates } from "@/features/demo/booking/components/booking-step-dates"
import { BookingStepGuests } from "@/features/demo/booking/components/booking-step-guests"
import { BookingStepPayment } from "@/features/demo/booking/components/booking-step-payment"
import { BookingStepReview } from "@/features/demo/booking/components/booking-step-review"
import { useBookingWizard } from "@/features/demo/booking/hooks/use-booking-wizard"
import { useBookingWizardStore } from "@/features/demo/booking/store/booking-wizard-store"

export function BookingContainer() {
  const { step } = useBookingWizard()
  const [hydrated, setHydrated] = useState(false)

  // The store skips automatic hydration (see its doc comment): restore the
  // sessionStorage draft once on the client, after the first render.
  useEffect(() => {
    Promise.resolve(useBookingWizardStore.persist.rehydrate()).finally(() =>
      setHydrated(true),
    )
  }, [])

  return (
    <div className="max-w-xl space-y-6 rounded-md border bg-card p-6 shadow-sm">
      {hydrated ? (
        <>
          <BookingProgress />
          {step === "dates" && <BookingStepDates />}
          {step === "guests" && <BookingStepGuests />}
          {step === "payment" && <BookingStepPayment />}
          {step === "review" && <BookingStepReview />}
        </>
      ) : (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
    </div>
  )
}
