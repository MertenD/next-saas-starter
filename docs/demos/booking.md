# Demo: Booking Wizard

**Route:** `/demo/booking` · **Feature module:** `src/features/demo/booking/`

## What this demonstrates

A multi-step form wizard with client-only state that's fully decoupled from server state: a feature-scoped Zustand store (not the global `src/stores/ui-store.ts`) persisted to `sessionStorage`, per-step validation with `react-hook-form` + Zod, and handling a genuinely unreliable backend - the submit endpoint fails at random on purpose, forcing the last step to implement a real error/retry path instead of assuming the happy path.

## Key files

| File | Role |
|---|---|
| `model/booking.ts` | `BOOKING_STEPS` order (`dates → guests → payment → review`) |
| `schema/booking-schema.ts` | Per-step Zod schemas + the combined `bookingSchema` |
| `store/booking-wizard-store.ts` | Zustand store, `persist` middleware → `sessionStorage` |
| `hooks/use-booking-wizard.ts` | Thin hook over the store (step, data, navigation) |
| `hooks/use-submit-booking.ts` | Wraps the `booking.submit` mutation |
| `server/router.ts` | `bookingRouter.submit` - simulated latency + random failure |
| `components/booking-container.tsx` + one component per step | UI |

## How it works

1. **Step order** comes from a single constant: `BOOKING_STEPS = ["dates", "guests", "payment", "review"]`. `BookingContainer` just renders whichever step component matches the current step.

2. **Wizard state** lives in `useBookingWizardStore`, a Zustand store with the `persist` middleware backed by `sessionStorage` (not `localStorage`):

   ```ts
   export const useBookingWizardStore = create<BookingWizardState>()(
     persist(
       (set) => ({ step: BOOKING_STEPS[0], data: {}, /* setStepData, next, back, reset */ }),
       { name: "booking-wizard", storage: createJSONStorage(() => sessionStorage) },
     ),
   );
   ```

   `sessionStorage` is the deliberate choice: an accidental refresh mid-wizard shouldn't lose progress, but a half-finished booking draft also shouldn't survive closing the tab the way a `localStorage`-persisted store would. This is the pattern to reach for any time you build a multi-step flow with the same requirement.

3. **Per-step validation.** Each step component (`BookingStepDates`, `BookingStepGuests`, `BookingStepPayment`) is its own `react-hook-form` form resolved against its own Zod schema (`tripDatesSchema`, `guestsSchema`, `paymentSchema`) - not one giant form for the whole wizard. A step only calls `setStepData()` + `next()` once its own fields pass validation.

4. **Submission.** The Review step calls `useSubmitBooking()` → the `booking.submit` tRPC mutation with the accumulated `data` (validated again server-side against the combined `bookingSchema`).

5. **Deliberately flaky server.** `bookingRouter.submit` isn't a real payment processor - it's built to force real error handling:

   ```ts
   const SIMULATED_LATENCY_MS = 600;
   const SIMULATED_FAILURE_RATE = 0.2; // fails ~1 in 5 submissions
   ```

   On success it returns a `confirmationId`; the Review step then calls `reset()` on the store (clearing `sessionStorage`) once the user chooses "Book another trip".

## Try it

Open `/demo/booking`, fill in all four steps, and submit. About 1 in 5 submissions fails on purpose - retry to see it succeed. Refresh the page partway through and note your progress survives (thanks to the `sessionStorage` persistence); close and reopen the tab and it's gone.

## Related docs

- [Frontend - State management](../frontend.md#state-management) - Zustand vs. TanStack Query, when to reach for a feature-local persisted store
- [Features](../features.md) - the feature-module pattern this demo follows
