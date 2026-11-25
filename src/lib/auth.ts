import { checkout, polar, portal } from "@polar-sh/better-auth"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { APIError } from "better-auth/api"
import { admin } from "better-auth/plugins"
import { adminAc, defaultRoles } from "better-auth/plugins/admin/access"
import { ADMIN_ROLE, isOwnerRole, OWNER_ROLE } from "@/config/constants"
import { env } from "@/config/env"
import { inngest } from "@/inngest/client"
import { InngestEvents } from "@/inngest/functions"
import { isOwnerEmail } from "@/lib/admin"
import prisma from "@/lib/db"
import {
  deleteAccountEmailHtml,
  resetPasswordEmailHtml,
  sendEmail,
  verifyEmailHtml,
} from "@/lib/mailer"
import { isPolarEnabled, polarClient } from "./polar"
import { deletePolarCustomer, deleteUserRedisData } from "./user-data"

/**
 * Mirrors a freshly created local user into Polar as a customer. Does nothing
 * when Polar isn't configured. If the Polar call fails, the local user is
 * deleted again and the error is rethrown, so sign-up fails instead of leaving
 * a user without a Polar customer.
 */
async function mirrorUserToPolar(user: {
  id: string
  email: string
  name: string
}) {
  if (!isPolarEnabled || !polarClient) return

  let polarCustomer = null
  try {
    polarCustomer = await polarClient.customers.create({
      externalId: user.id,
      email: user.email,
      name: user.name,
    })
  } catch (error) {
    console.error("Error creating Polar customer:", error)

    if (polarCustomer) {
      try {
        await polarClient.customers.delete({ id: polarCustomer.id })
      } catch (polarError) {
        console.error("Error rolling back Polar customer:", polarError)
      }
    }

    await prisma.user.delete({ where: { id: user.id } })
    throw error
  }
}

/**
 * Keeps the owner role in line with `OWNER_EMAILS` at sign-in:
 * - A user whose email is listed AND verified becomes owner (without the
 *   verification check, whoever registers a listed address first would take
 *   over the admin area).
 * - An owner whose email is no longer listed falls back to a plain user. Admins
 *   appointed in the admin UI are never touched here.
 * A demoted owner is promoted again at the next sign-in if the email returns to
 * the list, so a forgotten env variable on one deploy heals itself.
 */
async function syncOwnerRole(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true, role: true },
  })
  if (!user) return

  const isOwner = isOwnerRole(user.role)
  const isListed = isOwnerEmail(user.email)

  if (isListed && user.emailVerified && !isOwner) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: OWNER_ROLE },
    })
  } else if (!isListed && isOwner) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "user" },
    })
  }
}

/**
 * The server-side Better Auth instance. This is the single source of truth
 * for authentication: it wires up the Prisma adapter, email/password +
 * OAuth (Google/GitHub, only enabled when their client id/secret are set),
 * email verification, and the optional Polar billing plugin.
 *
 * Consumed by the catch-all route handler (`src/app/api/auth/[...all]/route.ts`),
 * by `src/lib/auth-utils.ts` for server-side session/premium checks, and by
 * the tRPC context (`src/trpc/init.ts`). The matching client-side instance
 * lives in `src/lib/auth-client.ts`.
 */
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: resetPasswordEmailHtml({ url }),
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html: verifyEmailHtml({ url }),
      })
    },
  },
  user: {
    // GDPR erasure (Art. 17): users delete their own account from Settings ->
    // Privacy. The deletion is confirmed through a link sent by email (works for
    // password and OAuth accounts alike, and protects a hijacked session).
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        void sendEmail({
          to: user.email,
          subject: "Confirm your account deletion",
          html: deleteAccountEmailHtml({ url }),
        })
      },
      // Runs before anything is deleted: if Polar fails the account stays, so
      // nobody is left being billed without an account. Cancels the Polar
      // subscription (no refund), see docs/gdpr.md.
      beforeDelete: async (user) => {
        try {
          await deletePolarCustomer(user.id)
        } catch (error) {
          console.error("Error deleting Polar customer:", error)
          throw new APIError("INTERNAL_SERVER_ERROR", {
            message:
              "Your billing data could not be deleted. Your account was not deleted, please try again.",
          })
        }
      },
      afterDelete: async (user) => {
        await deleteUserRedisData(user.id)
      },
    },
    additionalFields: {
      // Preferred UI language, kept in sync with the ui-locale cookie (see src/components/locale-sync.tsx)
      locale: { type: "string", required: false },
    },
  },
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
  plugins: [
    // Roles, banning and user management. The admin UI (`src/features/admin`)
    // calls its endpoints from tRPC procedures behind `adminProcedure`.
    admin({
      defaultRole: "user",
      // Owners get exactly the admin permissions; they differ only in where
      // the role is managed (env list vs. admin UI).
      roles: { ...defaultRoles, [OWNER_ROLE]: adminAc },
      adminRoles: [ADMIN_ROLE, OWNER_ROLE],
    }),
    ...(isPolarEnabled && polarClient
      ? [
          polar({
            client: polarClient,
            createCustomerOnSignUp: false,
            use: [
              checkout({
                // The product id comes from POLAR_PRODUCT_ID (polar.sh dashboard)
                // biome-ignore lint/style/noNonNullAssertion: guaranteed non-null when isPolarEnabled is true
                products: [{ productId: env.POLAR_PRODUCT_ID!, slug: "pro" }],
                // biome-ignore lint/style/noNonNullAssertion: guaranteed non-null when isPolarEnabled is true
                successUrl: env.POLAR_SUCCESS_URL!,
                authenticatedUsersOnly: true,
              }),
              portal(),
            ],
          }),
        ]
      : []),
  ],
  // Keeps the local user and the Polar customer in sync: whenever a user
  // signs up, mirror them into Polar so subscriptions can be attached later.
  // If Polar customer creation fails, the local user is rolled back too, so
  // we never end up with a user that has no corresponding Polar customer.
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await mirrorUserToPolar(user)

          // Fire and forget: a down Inngest server must never break sign-up.
          inngest
            .send({
              name: InngestEvents.UserSignedUp,
              data: { userId: user.id },
            })
            .catch((error) => {
              console.error("Error sending user signed up event:", error)
            })
        },
      },
    },
    session: {
      create: {
        // Promotes verified addresses listed in OWNER_EMAILS and demotes
        // owners that were removed from it. Checked at sign-in (not sign-up)
        // so an address that is verified later, e.g. through the email link,
        // still gets promoted.
        before: async (session) => {
          await syncOwnerRole(session.userId)
        },
      },
    },
  },
})
