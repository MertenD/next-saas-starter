import { env } from "@/config/env"

/** OAuth providers the UI knows how to render a button for. Add new ones here and in `src/features/auth/oauth-buttons.tsx`. */
export type OAuthProvider = "github" | "google"

/**
 * Server-only: the OAuth providers that are actually configured (client id
 * and secret both set), mirroring the `socialProviders` block in
 * `src/lib/auth.ts`. Pass the result from a Server Component page to the
 * login/signup forms so buttons for unconfigured providers never render.
 */
export function getEnabledOAuthProviders(): OAuthProvider[] {
  const providers: OAuthProvider[] = []
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) providers.push("github")
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) providers.push("google")
  return providers
}
