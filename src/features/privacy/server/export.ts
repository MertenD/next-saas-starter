import { getPolarCustomerState } from "@/lib/auth-utils"
import prisma from "@/lib/db"
import { isPolarNotFound } from "@/lib/user-data"

/** Notes shipped inside every export, so the file explains its own limits. */
const EXPORT_NOTES = [
  "This file contains the personal data this application stores about you.",
  "Passwords are only stored as salted hashes and are not part of this export.",
  "Session tokens and OAuth access tokens are secrets and are left out on purpose.",
  "Chats of the AI demo are kept in your browser only and are not stored on the server.",
]

/**
 * Collects everything the application stores about one user, for the GDPR
 * right of access and data portability (Art. 15 and 20): the profile, the
 * linked sign-in methods, the sessions, the content the user created and, when
 * Polar is configured, the billing data held there. Returned as plain JSON
 * (machine readable) and served by `GET /api/account/export`.
 *
 * When you add a table with user data to the Prisma schema, add it here too
 * (and to the data inventory in `docs/gdpr.md`).
 */
export async function buildUserDataExport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      locale: true,
      role: true,
      banned: true,
      createdAt: true,
      updatedAt: true,
      accounts: {
        select: {
          providerId: true,
          accountId: true,
          scope: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      sessions: {
        orderBy: { createdAt: "desc" },
        select: {
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          expiresAt: true,
        },
      },
      posts: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          published: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!user) return null
  const { accounts, sessions, posts, ...profile } = user

  return {
    exportedAt: new Date().toISOString(),
    notes: EXPORT_NOTES,
    profile,
    signInMethods: accounts,
    sessions,
    posts,
    billing: await loadBillingData(userId),
  }
}

/** The customer record Polar holds for the user, or why there is none. Never throws. */
async function loadBillingData(userId: string) {
  try {
    const customer = await getPolarCustomerState(userId)
    if (customer === null) return { status: "not-configured" as const }
    return { status: "ok" as const, customer }
  } catch (error) {
    if (isPolarNotFound(error)) return { status: "no-customer" as const }
    console.error("Error loading Polar data for the export:", error)
    return { status: "unavailable" as const }
  }
}
