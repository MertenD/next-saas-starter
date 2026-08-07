"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useBookingWizard } from "@/features/demo/booking/hooks/use-booking-wizard"
import type { TripDatesData } from "@/features/demo/booking/schema/booking-schema"

export function BookingStepDates() {
  const t = useTranslations("booking")
  const { data, setStepData, next } = useBookingWizard()

  const tripDatesFormSchema = z
    .object({
      checkIn: z.string().min(1, t("form.validation.checkInRequired")),
      checkOut: z.string().min(1, t("form.validation.checkOutRequired")),
    })
    .refine((values) => new Date(values.checkOut) > new Date(values.checkIn), {
      message: t("form.validation.checkOutAfterCheckIn"),
      path: ["checkOut"],
    })

  const form = useForm<TripDatesData>({
    resolver: zodResolver(tripDatesFormSchema),
    defaultValues: {
      checkIn: data.checkIn ?? "",
      checkOut: data.checkOut ?? "",
    },
  })

  function onSubmit(values: TripDatesData) {
    setStepData(values)
    next()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 items-start">
          <FormField
            control={form.control}
            name="checkIn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.checkInLabel")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="checkOut"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.checkOutLabel")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">{t("actions.next")}</Button>
        </div>
      </form>
    </Form>
  )
}
