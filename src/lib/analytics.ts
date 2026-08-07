/**
 * Custom Plausible goal events. Add new events here and pass the key to
 * `usePlausible<PlausibleEvents>()` for type-checked `plausible(...)` calls.
 * https://plausible.io/docs/custom-event-goals
 */
export type PlausibleEvents = {
  "Sign Up": never
  Login: never
  "Upgrade Clicked": never
}
