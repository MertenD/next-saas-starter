import { Resend } from "resend"
import { env } from "@/config/env"

/** Whether Resend is configured. See {@link sendEmail} in `src/lib/mailer.ts` for the fallback behavior when it isn't. */
export const isResendEnabled = !!(env.RESEND_API_KEY && env.EMAIL_FROM)

/** The Resend SDK client, or `null` when email sending isn't configured (see {@link isResendEnabled}). */
export const resendClient = isResendEnabled
  ? new Resend(env.RESEND_API_KEY)
  : null
