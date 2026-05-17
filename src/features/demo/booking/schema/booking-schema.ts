import { z } from "zod";

export const tripDatesBaseSchema = z.object({
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
});

export const tripDatesSchema = tripDatesBaseSchema.refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  { path: ["checkOut"] },
);

export const guestsSchema = z.object({
  adults: z.number().min(1).max(16),
  children: z.number().min(0).max(16),
  infants: z.number().min(0).max(5),
});

export const paymentSchema = z.object({
  cardName: z.string().min(1),
  cardNumber: z.string().regex(/^\d{16}$/),
  cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/),
});

export const bookingSchema = tripDatesBaseSchema
  .extend(guestsSchema.shape)
  .extend(paymentSchema.shape)
  .refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
    path: ["checkOut"],
  });

export type TripDatesData = z.infer<typeof tripDatesBaseSchema>;
export type GuestsData = z.infer<typeof guestsSchema>;
export type PaymentData = z.infer<typeof paymentSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
