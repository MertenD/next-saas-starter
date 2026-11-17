"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { MinusIcon, PlusIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useForm, useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  useBookingActions,
  useBookingData,
} from "@/features/demo/booking/hooks/use-booking-wizard"
import {
  type GuestsData,
  guestsSchema,
} from "@/features/demo/booking/schema/booking-schema"

const GUEST_FIELDS = ["adults", "children", "infants"] as const

const GUEST_LIMITS: Record<
  (typeof GUEST_FIELDS)[number],
  { min: number; max: number }
> = {
  adults: { min: 1, max: 16 },
  children: { min: 0, max: 16 },
  infants: { min: 0, max: 5 },
}

export function BookingStepGuests() {
  const t = useTranslations("booking")
  const data = useBookingData()
  const { setStepData, next, back } = useBookingActions()

  const form = useForm<GuestsData>({
    resolver: zodResolver(guestsSchema),
    defaultValues: {
      adults: data.adults ?? 1,
      children: data.children ?? 0,
      infants: data.infants ?? 0,
    },
  })

  // `useWatch` instead of `form.watch()`: subscribes this component to the
  // values without opting out of the React Compiler's optimizations.
  const [adults, children, infants] = useWatch({
    control: form.control,
    name: [...GUEST_FIELDS],
  })
  const values: GuestsData = { adults, children, infants }

  function adjust(field: (typeof GUEST_FIELDS)[number], delta: number) {
    const { min, max } = GUEST_LIMITS[field]
    const current = form.getValues(field)
    form.setValue(field, Math.min(max, Math.max(min, current + delta)))
  }

  function onSubmit(formValues: GuestsData) {
    setStepData(formValues)
    next()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {GUEST_FIELDS.map((field) => (
        <div
          key={field}
          className="flex items-center justify-between rounded-md border p-4"
        >
          <div>
            <p className="text-body-md font-medium">
              {t(`form.guests.${field}Label`)}
            </p>
            <p className="text-body-sm text-muted-foreground">
              {t(`form.guests.${field}Description`)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => adjust(field, -1)}
              disabled={values[field] <= GUEST_LIMITS[field].min}
              aria-label={t("form.guests.decrease")}
            >
              <MinusIcon />
            </Button>
            <span className="w-6 text-center text-body-md">
              {values[field]}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => adjust(field, 1)}
              disabled={values[field] >= GUEST_LIMITS[field].max}
              aria-label={t("form.guests.increase")}
            >
              <PlusIcon />
            </Button>
          </div>
        </div>
      ))}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={back}>
          {t("actions.back")}
        </Button>
        <Button type="submit">{t("actions.next")}</Button>
      </div>
    </form>
  )
}
