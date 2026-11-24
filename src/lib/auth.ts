import { checkout, polar, portal } from "@polar-sh/better-auth"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin } from "better-auth/plugins"
import { ADMIN_ROLE, isAdminRole } from "@/config/constants"
import { env } from "@/config/env"
import { inngest } from "@/inngest/client"
import { InngestEvents } from "@/inngest/functions"
import { isAdminEmail } from "@/lib/admin"
import prisma from "@/lib/db"
import {
  resetPasswordEmailHtml,
  sendEmail,
  verifyEmailHtml,
} from "@/lib/mailer"
import { isPolarEnabled, polarClient } from "./polar"

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
 * Makes a user admin when their email is listed in `ADMIN_EMAILS` AND
 * verified. Without the verification check, whoever registers an admin address
 * first (before its owner does) would take over the admin area.
 */
async function promoteConfiguredAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true, role: true },
  })
  if (!user || !user.emailVerified || isAdminRole(user.role)) return
  if (!isAdminEmail(user.email)) return

  await prisma.user.update({
    where: { id: userId },
    data: { role: ADMIN_ROLE },
  })
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
    admin({ defaultRole: "user", adminRoles: [ADMIN_ROLE] }),
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
              data: { userId: user.id, email: user.email },
            })
            .catch((error) => {
              console.error("Error sending user signed up event:", error)
            })
        },
      },
    },
    session: {
      create: {
        // Grants the admin role to verified addresses listed in ADMIN_EMAILS
        // at sign-in. Checked at sign-in (not sign-up) so an address that is
        // verified later, e.g. through the email link, still gets promoted.
        before: async (session) => {
          await promoteConfiguredAdmin(session.userId)
        },
      },
    },
  },
})
