"use client";

import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useSubmitBooking() {
  const trpc = useTRPC();
  return useMutation(trpc.booking.submit.mutationOptions());
}
