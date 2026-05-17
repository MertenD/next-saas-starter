"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useBookingWizard } from "@/features/demo/booking/hooks/use-booking-wizard";
import { BOOKING_STEPS } from "@/features/demo/booking/model/booking";
import { cn } from "@/lib/utils";

export function BookingProgress() {
  const t = useTranslations("booking");
  const { step } = useBookingWizard();
  const currentIndex = BOOKING_STEPS.indexOf(step);

  return (
    <ol className="flex items-center">
      {BOOKING_STEPS.map((s, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <li key={s} className="flex flex-1 items-center last:flex-initial">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-body-sm font-medium",
                  isCurrent &&
                    "border-primary bg-primary text-primary-foreground",
                  isDone && "border-primary text-primary",
                  !isCurrent && !isDone && "text-muted-foreground",
                )}
              >
                {isDone ? <CheckIcon className="size-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-body-sm sm:inline",
                  isCurrent
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {t(`steps.${s}`)}
              </span>
            </div>
            {index < BOOKING_STEPS.length - 1 && (
              <span aria-hidden className="mx-3 h-px flex-1 bg-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
