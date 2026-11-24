# Admin Area

Roles, an admin overview with user and revenue numbers, and user management (`/admin`, `/admin/users`). Feature module: `src/features/admin/`. Built on the Better Auth [admin plugin](https://www.better-auth.com/docs/plugins/admin) and the Polar Metrics API.

## Roles and access

Every user has a `role` (`"user"` by default, or `"admin"`), stored on the `User` row (`USER_ROLES`, `isAdminRole()` in `src/config/constants.ts`). The role is checked in three places, and all of them must agree:

| Layer | Guard | What happens to a non-admin |
|---|---|---|
| Pages | `requireAdmin()` (`src/lib/auth-utils.ts`) at the top of every page under `src/app/(dashboard)/admin/` | Redirect to `/dashboard` |
| API | `adminProcedure` (`src/trpc/init.ts`) for every procedure in `trpc.admin.*` | `FORBIDDEN` |
| UI | The sidebar shows the "Admin" section only for `useDashboard().user.role === "admin"` | Link is not rendered (cosmetic, not security) |

The role is read from the session on each request, so a demoted admin loses access with the next request.

## Creating the first admin

Set `ADMIN_EMAILS` (comma-separated) in `.env`. A user whose email is in that list becomes admin at their next sign-in, **but only once the address is verified** (email link, or an OAuth provider that reports it as verified). Without the verification rule, whoever registered an admin address first would take over the admin area.

- Without Resend the verification link is printed to the server log (see [Auth & Billing](./auth-and-billing.md#password-reset--email-verification)), copy it from there.
- Removing an email from `ADMIN_EMAILS` does not demote anyone. Change the role in the users table instead.
- Roles of other users are managed in the UI afterwards, so `ADMIN_EMAILS` only needs the first one or two addresses.

## Overview (`/admin`)

Tiles from two sources, each with loading, error and empty states:

- **Users** (database): total, new in the last 30 days, verified emails.
- **Revenue and subscriptions** (live from Polar `metrics.get`, nothing is stored locally): revenue of the last 30 days, MRR, active, new and canceled subscriptions. Money is in cents (USD). Without the `POLAR_*` variables the section shows an empty state; if the Polar call fails (8 s timeout) only this section shows an error with retry, the user tiles stay.

## User management (`/admin/users`)

Searchable, paginated table (URL state via nuqs, same pattern as the [pagination demo](./demos/pagination.md)). Per row:

| Action | Confirmation | Notes |
|---|---|---|
| Make admin / remove admin role | `ConfirmDialog` | |
| Ban / unban | `ConfirmDialog` (ban only) | Blocks sign-in and ends all sessions |
| Delete | `CriticalConfirmDialog` (retype the email) | Deletes the user with all data |

Admins cannot ban, delete or demote themselves (their own row has no menu, and the server refuses it as well).

## What ban and delete do to Polar subscriptions

| | Ban | Delete |
|---|---|---|
| Sign-in | Blocked, sessions revoked | Account is gone |
| Polar subscription | **Untouched**: keeps renewing, the customer is still charged | **Canceled immediately**, benefits revoked (the Polar customer is deleted first) |
| Refund | **None** | **None**: Polar does not refund automatically |

So as an admin:

1. **Check the subscription first.** Both dialogs look up the user's active Polar subscriptions and warn you when there is one.
2. **Banning a paying customer** does not stop billing. Cancel the subscription in the Polar dashboard if the ban should also end the charges.
3. **Refunds are a manual step in the Polar dashboard.** Issue them *before* deleting the user, since deleting removes the Polar customer.
4. **Delete is ordered Polar first, then local.** If Polar fails, the user is kept and you see an error, so nobody is left being charged without an account. A user without a Polar customer (404) is deleted normally.

Deleting a user is irreversible on both sides. Use the UI for it: calling the Better Auth endpoint `/api/auth/admin/remove-user` directly skips the Polar cleanup.

## Security notes

- The Better Auth admin plugin also exposes its own endpoints under `/api/auth/admin/*` (including user impersonation) to signed-in admins. They check the role themselves, but only the `trpc.admin.*` procedures add the self-protection and the Polar handling above.
- `role`, `banned`, `banReason`, `banExpires` (user) and `impersonatedBy` (session) are plugin fields, added by the migration `add_admin_roles`.
- Admin tables are loaded through tRPC and therefore also end up in the persisted React Query cache (IndexedDB). It is cleared on sign-out by `useSignOut()`.

## Adding another admin feature

1. Add the procedure to `src/features/admin/server/router.ts` using `adminProcedure`, never `protectedProcedure`.
2. Put the UI under `src/app/(dashboard)/admin/` and call `requireAdmin()` at the top of the page.
3. Add a sidebar entry to `ADMIN_ITEMS` in `src/components/app-sidebar.tsx` and the `sidebar.nav.*` messages.
