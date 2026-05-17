# Authentication & Billing

Authentication is [Better Auth](https://www.better-auth.com); billing is [Polar](https://polar.sh); transactional email is [Resend](https://resend.com). Both billing and email sending are optional to configure individually - auth itself (email/password) always works out of the box.

## Better Auth configuration

`src/lib/auth.ts` sets up the server-side `auth` instance:

- **Adapter**: Prisma (`prismaAdapter(prisma, { provider: "postgresql" })`).
- **Email/password**: always enabled, with `autoSignIn: true` (signs the user in immediately after registering). `sendResetPassword` is wired to `src/lib/mailer.ts` to email the "reset your password" link.
- **Email verification**: `emailVerification.sendOnSignUp: true` sends a verification email right after sign-up, via `sendVerificationEmail` (also wired to `src/lib/mailer.ts`). Verification is **soft** - `requireEmailVerification` is intentionally left unset, so login is never blocked on it. Unverified users just see a badge + "resend" button in `/settings` (Account tab).
- **OAuth**: Google and GitHub are added to `socialProviders` conditionally - a provider block only appears if both its `CLIENT_ID` and `CLIENT_SECRET` env vars are set, so leaving them unset just omits that provider from the login form.
- **Polar plugin**: registered only when `isPolarEnabled` is true (see below), wiring `checkout` (product/slug list, success URL) and `portal` (customer self-service billing portal) sub-plugins.
- **`databaseHooks.user.create.after`**: fires after every new user is created. If Polar is enabled, it creates a matching Polar customer (`externalId: user.id`). If that Polar call fails, it rolls back by deleting the just-created Postgres user and rethrowing - sign-up either fully succeeds (Better Auth user + Polar customer) or fully fails, never half of one.

`src/lib/auth-client.ts` is the React client (`authClient = createAuthClient({ plugins: [polarClient()] })`), used by Client Components for sign-in/up/out, password reset (`requestPasswordReset`, `resetPassword`), email verification (`sendVerificationEmail`), profile updates (`updateUser`), password changes (`changePassword`), and reading Polar customer state (`authClient.customer.state()`).

## Password reset & email verification

- **Forgot/reset password**: `/forgot-password` (`src/features/auth/forgot-password-form.tsx`) calls `authClient.requestPasswordReset({ email, redirectTo: "/reset-password" })`. The email link lands on `/reset-password?token=...` (`src/features/auth/reset-password-form.tsx`), which calls `authClient.resetPassword({ newPassword, token })`. A missing/invalid token renders an "invalid link" state instead of the form.
- **Email verification**: sent automatically on sign-up. Better Auth's own `/api/auth/...` route verifies the token and redirects - no custom verify page is needed. Users can trigger a fresh one from `/settings` via `authClient.sendVerificationEmail()` (see `src/features/user/hooks/use-resend-verification-email.ts`).
- **Change password** (while logged in): the "Change password" form in `/settings` (Account tab) calls `authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: false })`.
- **Emails**: `src/lib/mailer.ts` sends via Resend (`src/lib/resend.ts`) when `RESEND_API_KEY`/`EMAIL_FROM` are set; otherwise it logs the recipient/subject/link to the console instead, so these flows are testable in local dev with zero Resend setup. See [`environment-variables.md`](./environment-variables.md#resend-email-optional).
- **Dashboard banner**: `src/components/email-verification-banner.tsx` reads `authClient.useSession()` directly (`emailVerified` is a base Better Auth session field, no extra query needed) and renders a non-dismissible `Alert` with a resend button for any unverified user. It's mounted once in `src/components/app-shell.tsx` (inside `SidebarInset`, above `{children}`), so it appears on every `(dashboard)` route with no per-page wiring.
- **Gated checkout**: `UpgradeToProButton` in `src/features/auth/user-info-card.tsx` checks `session.user.emailVerified` before calling `authClient.checkout()`. Unverified users get a `Dialog` explaining verification is required, with its own resend action, instead of opening Polar checkout - unverified accounts should never be able to pay (failed receipt delivery, weaker fraud/chargeback and account-recovery guarantees).

`src/lib/auth-utils.ts` holds the server-side guards:

| Function | Behavior |
|---|---|
| `requireAuth()` | Redirects to `/login` if there's no session. Used in `(dashboard)/layout.tsx`. |
| `requireUnauth()` | Redirects to `/` if there *is* a session. Used in `(auth)` pages so logged-in users can't see login/signup. |
| `requireAuthAndPremium(redirectUrl)` | Like `requireAuth()`, plus checks for an active Polar subscription and redirects if absent - skipped entirely when Polar is unconfigured. |
| `getSessionOnServer()` | Returns the session (or `null`) without redirecting. |
| `requirePremiumUserFromRequest(req)` | Same premium check as above, but throws a `401`/`403` `Response` instead of redirecting - for use in raw Next.js route handlers rather than Server Components. |

There's no `middleware.ts` in this project - all route protection goes through these functions, called explicitly in layouts/pages/routes.

## OAuth providers

**Google:** [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID. Set the authorized redirect URI to `http://localhost:3000/api/auth/callback/google` (swap the domain in production).

**GitHub:** GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App. Set the callback URL to `http://localhost:3000/api/auth/callback/github`.

Then set the corresponding env vars - see [`environment-variables.md`](./environment-variables.md).

## Polar billing

`src/lib/polar.ts` is the central "is billing configured" gate:

```typescript
export const isPolarEnabled = !!(
  env.POLAR_ACCESS_TOKEN && env.POLAR_SERVER && env.POLAR_SUCCESS_URL
);
export const polarClient = isPolarEnabled ? new Polar({ ... }) : null;
```

Every place that checks subscription status (`premiumProcedure`, `requireAuthAndPremium`, `useHasActiveSubscription`) checks `isPolarEnabled` first and grants access to everyone when it's `false`. This means the premium-gated demos (e.g. `demo/posts`' `bulkPublish`) work with zero Polar setup - useful for developing without a Polar account, but remember to actually configure Polar before shipping anything that should be paywalled.

**Setup:**

1. Create an account at [polar.sh](https://polar.sh)
2. Create a product (e.g. "Pro Plan")
3. Copy its **Product ID** and replace `YOUR_PRODUCT_ID` in `src/lib/auth.ts` (`checkout({ products: [{ productId: "YOUR_PRODUCT_ID", slug: "pro" }] })`)
4. Set `POLAR_ACCESS_TOKEN`, `POLAR_SUCCESS_URL`, and `POLAR_SERVER` (`sandbox` while testing) in `.env`

## Premium subscription flow

1. User signs up → Better Auth creates the `User` row → `databaseHooks.user.create.after` creates a matching Polar customer.
2. User upgrades → `authClient.checkout({ slug: "pro" })` opens the Polar checkout for the product registered under that slug.
3. `premiumProcedure` (server) checks for an active subscription via `polarClient.customers.getStateExternal({ externalId: user.id })`.
4. `useHasActiveSubscription()` (client, from `src/features/subscriptions/hooks/use-subscription.ts`) exposes the same check for UI gating - it first reads the public `user.isPolarEnabled` tRPC flag, and short-circuits to "everyone is premium" when Polar isn't configured.

## Premium feature gating - usage

Server-side (tRPC):

```typescript
myPremiumEndpoint: premiumProcedure.mutation(async ({ ctx }) => {
  // ctx.customer is the Polar customer state (or null in mock mode)
});
```

Client-side:

```typescript
import { useHasActiveSubscription } from "@/features/subscriptions/hooks/use-subscription";
const { hasActiveSubscription } = useHasActiveSubscription();
```

Trigger checkout:

```typescript
import { authClient } from "@/lib/auth-client";
authClient.checkout({ slug: "pro" });
```
