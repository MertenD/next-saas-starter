import { env } from "@/config/env"

const ownerEmails = new Set(
  (env.OWNER_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
)

/**
 * Whether an email is listed in `OWNER_EMAILS`. Only a hint: the owner role is
 * granted in `src/lib/auth.ts` after the address is verified, so someone who
 * merely registers with a listed address gets nothing.
 */
export function isOwnerEmail(email: string) {
  return ownerEmails.has(email.trim().toLowerCase())
}
