"use client";

import { BookingProgress } from "@/features/demo/booking/components/booking-progress";
import { BookingStepDates } from "@/features/demo/booking/components/booking-step-dates";
import { BookingStepGuests } from "@/features/demo/booking/components/booking-step-guests";
import { BookingStepPayment } from "@/features/demo/booking/components/booking-step-payment";
import { BookingStepReview } from "@/features/demo/booking/components/booking-step-review";
import { useBookingWizard } from "@/features/demo/booking/hooks/use-booking-wizard";

export function BookingContainer() {
  const { step } = useBookingWizard();

  return (
    <div className="max-w-xl space-y-6 rounded-md border bg-card p-6 shadow-sm">
      <BookingProgress />
      {step === "dates" && <BookingStepDates />}
      {step === "guests" && <BookingStepGuests />}
      {step === "payment" && <BookingStepPayment />}
      {step === "review" && <BookingStepReview />}
    </div>
  );
}
