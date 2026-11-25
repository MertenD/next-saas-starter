# GDPR (DSGVO)

What this template does for data protection, and what is still on you. The technical side of the data subject rights is built in: the privacy policy and imprint pages, data export, account deletion, active sessions, short retention of temporary data and no personal data in background-job events.

> **This is not legal advice.** Software cannot make a product GDPR compliant on its own. Compliance also depends on your contracts (data processing agreements), your hosting, your processes and the exact features you ship. The page below lists what the code covers and what you have to decide, sign and review yourself. Have the privacy policy checked by a lawyer before you go live.

## What is built in

| GDPR topic | What the template does | Where |
|---|---|---|
| Information duties (Art. 12-14) | Public privacy policy at `/privacy` and imprint at `/imprint`, linked under the sign-in pages and in Settings. The policy lists the data, purposes, legal bases, recipients, cookies, retention and rights, and **follows your configuration**: Polar, Resend, OpenRouter, Sentry, Plausible and OAuth providers only appear when switched on. A notice with a link is shown on the sign-up form. | `src/app/(legal)/`, `src/config/legal.ts`, messages `legal.*` |
| Access and portability (Art. 15, 20) | "Download my data" (Settings > Privacy) returns a JSON file with the profile, sign-in methods, sessions, posts and the customer record from Polar. Secrets (password hash, session tokens, OAuth tokens) are left out. | `GET /api/account/export`, `buildUserDataExport()` in `src/features/privacy/server/export.ts` |
| Rectification (Art. 16) | Users edit their profile themselves. | Settings > Account |
| Erasure (Art. 17) | "Delete my account" (Settings > Privacy), confirmed by an email link. Deletes the account with all data and the external data, see [Account deletion](#account-deletion). | `user.deleteUser` in `src/lib/auth.ts`, `src/lib/user-data.ts` |
| Restriction and objection (Art. 18, 21) | Handled by contact: the privacy policy names the email address from `LEGAL.privacyEmail`. There is no profiling or automated decision-making. | `src/config/legal.ts` |
| Control over sessions | Users see their devices (browser, OS, IP, time) and can sign any of them out, or all others. A signed-out device gets no new data, and lands on `/login` (which wipes its cached data) at its next navigation. An idle or offline tab keeps showing what it had already loaded until then. | Settings > Privacy, `trpc.privacy.*` |
| Data protection by default (Art. 25) | Sentry Session Replay is **off**. Plausible is cookie-free. Inngest events carry user ids, never emails. Emails are not printed to the logs in production. Only strictly necessary cookies are used, so no consent banner is needed. | see below |
| Storage limitation (Art. 5(1)(e)) | A daily Inngest job deletes expired sessions and verification tokens. Sessions last 7 days, the AI chat buffer in Redis 24 hours. Cached personal data in the browser is wiped on sign-out and whenever the sign-in page is shown. | `cleanupExpiredAuthData` in `src/inngest/functions.ts`, `src/components/clear-local-data.tsx` |
| Security (Art. 32) | Passwords stored as salted hashes, secure response headers, role-protected admin area, signed Inngest requests in production, per-user data scoping in every query. | see [Auth & Billing](./auth-and-billing.md), [Deployment](./deployment.md) |

## Account deletion

A user starts the deletion in Settings > Privacy and retypes their email in a confirmation dialog. We send a confirmation link by email (it works for password and OAuth accounts, and protects against a hijacked session). Only when the link is opened:

1. **Polar customer deleted first** (if billing is configured). This cancels the subscription immediately and revokes benefits. **Polar does not refund automatically**, the dialog says so. If Polar fails, the whole deletion is aborted and the account stays, so nobody keeps being billed without an account.
2. **Sessions, linked accounts and the user** are deleted in PostgreSQL; posts and everything else with a foreign key to the user disappear through `ON DELETE CASCADE`.
3. **Redis**: the user's AI chat stream data and pointers are removed (they would expire after 24 hours anyway).
4. The user lands on the sign-in page, which also clears the personal data cached in that browser.

The admin "delete user" action runs the same cleanup (Polar first, then the user, then Redis), see [Admin Area](./admin.md).

### What deletion does not reach

Be aware of these and cover them in your own processes and policy:

| Where | What remains | What to do |
|---|---|---|
| **Backups** (database dumps, volume snapshots) | Deleted users stay in old backups until those expire. | Keep backup retention short and document it. If you restore a backup, delete the users who were deleted since (keep a log of deleted user ids, without personal data). |
| **Polar** | Records Polar must keep by law (invoices, orders). | Say so in the privacy policy (it does when billing is on), check Polar's data processing terms. |
| **Inngest** | Old event payloads. The template only puts user ids in events (no email or name), so a stored event is a pseudonymous id. | Set a retention period on the Inngest server and never add personal data to event payloads. |
| **Sentry** | Error events and traces that were already sent. | Set a short retention in Sentry, do not call `Sentry.setUser` with an email or name, delete a user's events in Sentry on request. |
| **Resend** | Delivery logs of sent emails. | Set the shortest log retention in Resend. |
| **Server and proxy logs** | IP addresses and request times. | Keep log retention short (for example 7 to 30 days). |

## Data inventory

Keep this in sync with `src/features/privacy/server/export.ts` (what is exported) and the privacy policy messages. When you add a table or a service with personal data, add a row here, export it, delete it on account deletion and mention it in the policy.

| Data | Stored in | Purpose | Retention | Removed by |
|---|---|---|---|---|
| Name, email, verified flag, picture, language, role, ban state | PostgreSQL `user` | Account | Until deletion | Cascade on deletion |
| Password hash, OAuth provider ids and tokens | PostgreSQL `account` | Sign-in | Until deletion | Cascade on deletion |
| Session token, IP address, user agent, times | PostgreSQL `session` | Sign-in, security | Max. 7 days, expired rows purged daily | Daily job, cascade on deletion |
| Verification and reset tokens (include the email) | PostgreSQL `verification` | Email verification, password reset | Until they expire, purged daily | Daily job |
| Posts (demo content) | PostgreSQL `post` | The posts demo | Until deleted | Cascade on deletion |
| Customer record, subscriptions | Polar | Billing | While the customer exists, legal records longer | `deletePolarCustomer()` |
| AI chat stream chunks and pointers | Redis | Resume a running answer | 24 hours | TTL, `deleteUserRedisData()` |
| AI chat messages | Browser `sessionStorage` | Chat history of the demo | Until the tab closes or sign-out | Sign-out, `ClearLocalData` |
| Cached pages and query data | Browser service worker cache, IndexedDB | Offline use and speed | Until sign-out | Sign-out, `ClearLocalData` |
| Event payloads (user ids only) | Inngest | Background jobs | Per Inngest server settings | Retention setting |
| Error reports | Sentry (if enabled) | Fixing errors | Per Sentry settings | Retention setting |
| Usage statistics (no personal data) | Plausible (if enabled) | Analytics | Per Plausible settings | n/a |

## Recipients (processors)

Each of these is only used when you switch it on. For every one you use, **sign a data processing agreement (Art. 28)**, check where the data is processed and, outside the EU/EEA, the transfer mechanism (for example standard contractual clauses), and keep them in your record of processing activities.

| Service | Active when | Personal data it gets |
|---|---|---|
| Your hosting provider | always | everything, plus server logs. Set `LEGAL.hostingProvider`. |
| Polar | all four `POLAR_*` variables set | name, email, user id, subscription and payment data |
| Resend | `RESEND_API_KEY` and `EMAIL_FROM` set | recipient email, email content |
| OpenRouter and the model provider | `OPENROUTER_API_KEY` set | the messages users type into the AI chat. Tell users and keep the chat optional. |
| Sentry | `NEXT_PUBLIC_SENTRY_DSN` set | technical error data, IP address, browser, page URL |
| Plausible | `NEXT_PUBLIC_PLAUSIBLE_SRC` set | anonymous page views, no cookies, no personal profile |
| Google / GitHub | their client id and secret set | name, email and profile picture of users who choose that sign-in |

## Cookies and local storage

| Name | Type | Purpose | Needs consent? |
|---|---|---|---|
| Better Auth session cookie | Cookie | Keeps the user signed in | No, strictly necessary |
| `ui-locale` | Cookie | Remembers the language | No, strictly necessary for the chosen setting |
| `sidebar_state` | Cookie | Remembers the sidebar state | No, functional setting the user chose |
| React Query cache | IndexedDB | Speed | No, wiped on sign-out |
| Service worker cache | Cache storage | Offline use | No, wiped on sign-out |
| AI chat | `sessionStorage` | Chat history | No, ends with the tab |

No advertising or tracking cookies are set, so the template needs no cookie banner. **That changes as soon as you add tracking, marketing pixels, session replay or a non-cookieless analytics tool**: then you need a consent banner that blocks them until the user agrees, and an updated privacy policy.

### Sentry Session Replay is off

Replay records what users see and do. It needs a legal basis (usually consent) and a policy entry, so it is not enabled. To opt in, add `integrations: [Sentry.replayIntegration()]` and the `replaysSessionSampleRate` / `replaysOnErrorSampleRate` options in `src/instrumentation-client.ts`, behind a consent check, and update the privacy policy.

## Before you go live (checklist)

- [ ] Fill `src/config/legal.ts` (operator, address, contact, hosting provider) and check the imprint fields for your country and legal form.
- [ ] Have the privacy policy text (`messages/*.json`, `legal.privacy.*`) reviewed by a lawyer. Adjust it to what you add or remove.
- [ ] Sign data processing agreements with every processor you enabled (table above), check international transfers.
- [ ] Write your record of processing activities (Art. 30) from the data inventory above.
- [ ] Decide on backups: retention period, and the process to re-delete users after a restore.
- [ ] Set retention periods in Sentry, Inngest, Resend and for server logs.
- [ ] Test it end to end: sign up, download your data, end a session from another device, delete the account (with and without a Polar subscription) and check the database, Polar and Redis afterwards.
- [ ] Prepare a data breach process (notification to the authority within 72 hours, Art. 33).
- [ ] If you add tracking, marketing tools, session replay or anything that stores data on the device beyond the table above: add a consent banner and update the policy.
- [ ] If your product serves children, collects special categories of data or does profiling: get legal advice on additional duties (age checks, DPIA, ...).
- [ ] Appoint a data protection officer if the law requires one for your company.

## Extending it

- **New table with user data:** add it to `buildUserDataExport()`, make sure it is deleted with the user (`onDelete: Cascade` on the relation to `User`), add it to the inventory above and to the privacy policy messages.
- **New service that gets personal data:** add it to the recipients table, show it in the privacy policy page (flag in `src/app/(legal)/privacy/page.tsx`), delete the user's data there in `beforeDelete`/`afterDelete` in `src/lib/auth.ts` (or `src/lib/user-data.ts`).
- **New Inngest event:** send user ids, never emails or names. Look the data up in the database inside the function.
- **Never** log personal data, secrets or one-time links in production, and never call `Sentry.setUser` with an email or name.
