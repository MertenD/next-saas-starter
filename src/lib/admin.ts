import { env } from "@/config/env"

const adminEmails = new Set(
  (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
)

/**
 * Whether an email is listed in `ADMIN_EMAILS`. Only a hint: the role is
 * granted in `src/lib/auth.ts` after the address is verified, so someone who
 * merely registers with an admin address gets nothing.
 */
export function isAdminEmail(email: string) {
  return adminEmails.has(email.trim().toLowerCase())
}
