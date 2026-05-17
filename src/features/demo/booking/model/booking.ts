export const BOOKING_STEPS = ["dates", "guests", "payment", "review"] as const;
export type BookingStep = (typeof BOOKING_STEPS)[number];
