"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useBookingWizard } from "@/features/demo/booking/hooks/use-booking-wizard";
import type { PaymentData } from "@/features/demo/booking/schema/booking-schema";

export function BookingStepPayment() {
  const t = useTranslations("booking");
  const { data, setStepData, next, back } = useBookingWizard();

  const paymentFormSchema = z.object({
    cardName: z.string().min(1, t("form.validation.cardNameRequired")),
    cardNumber: z
      .string()
      .regex(/^\d{16}$/, t("form.validation.cardNumberInvalid")),
    cardExpiry: z
      .string()
      .regex(
        /^(0[1-9]|1[0-2])\/\d{2}$/,
        t("form.validation.cardExpiryInvalid"),
      ),
  });

  const form = useForm<PaymentData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardName: data.cardName ?? "",
      cardNumber: data.cardNumber ?? "",
      cardExpiry: data.cardExpiry ?? "",
    },
  });

  function onSubmit(values: PaymentData) {
    setStepData(values);
    next();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-body-sm text-muted-foreground">
          {t("form.payment.demoNotice")}
        </p>
        <FormField
          control={form.control}
          name="cardName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.payment.cardNameLabel")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("form.payment.cardNamePlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cardNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.payment.cardNumberLabel")}</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  maxLength={16}
                  placeholder={t("form.payment.cardNumberPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cardExpiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.payment.cardExpiryLabel")}</FormLabel>
              <FormControl>
                <Input
                  maxLength={5}
                  placeholder={t("form.payment.cardExpiryPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={back}>
            {t("actions.back")}
          </Button>
          <Button type="submit">{t("actions.next")}</Button>
        </div>
      </form>
    </Form>
  );
}
