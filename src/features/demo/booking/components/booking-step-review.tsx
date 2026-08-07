"use client"

import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useBookingWizard } from "@/features/demo/booking/hooks/use-booking-wizard"
import { useSubmitBooking } from "@/features/demo/booking/hooks/use-submit-booking"
import type { BookingFormData } from "@/features/demo/booking/schema/booking-schema"

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-body-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export function BookingStepReview() {
  const t = useTranslations("booking")
  const { data, back, reset } = useBookingWizard()
  const {
    mutate,
    isPending,
    isError,
    isSuccess,
    data: result,
    reset: resetMutation,
  } = useSubmitBooking()

  // Every prior step validates its fields before advancing, so `data` is
  // complete by the time this step renders.
  const bookingData = data as BookingFormData

  function handleStartOver() {
    resetMutation()
    reset()
  }

  if (isSuccess && result) {
    return (
      <div className="space-y-4 rounded-md border p-6 text-center">
        <CheckCircle2Icon className="mx-auto size-10 text-primary" />
        <div>
          <h2 className="text-display-sm font-semibold">
            {t("success.title")}
          </h2>
          <p className="text-body-sm text-muted-foreground">
            {t("success.description", {
              confirmationId: result.confirmationId,
            })}
          </p>
        </div>
        <Button onClick={handleStartOver}>{t("actions.startOver")}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-md border p-4">
        <SummaryRow
          label={t("form.checkInLabel")}
          value={bookingData.checkIn}
        />
        <SummaryRow
          label={t("form.checkOutLabel")}
          value={bookingData.checkOut}
        />
        <SummaryRow
          label={t("steps.guests")}
          value={t("summary.guests", {
            adults: bookingData.adults,
            children: bookingData.children,
            infants: bookingData.infants,
          })}
        />
        <SummaryRow
          label={t("form.payment.cardNumberLabel")}
          value={`•••• •••• •••• ${bookingData.cardNumber.slice(-4)}`}
        />
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>{t("errorTitle")}</AlertTitle>
          <AlertDescription>{t("errorDescription")}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={back}
          disabled={isPending}
        >
          {t("actions.back")}
        </Button>
        <Button
          type="button"
          onClick={() => mutate(bookingData)}
          disabled={isPending}
        >
          {isPending && <Spinner />}
          {isPending
            ? t("actions.confirming")
            : isError
              ? t("actions.retry")
              : t("actions.confirm")}
        </Button>
      </div>
    </div>
  )
}
