import LoginForm from "@/features/auth/login-form"
import { requireUnauth } from "@/lib/auth-utils"
import { getEnabledOAuthProviders } from "@/lib/oauth-providers"
import { authTitle } from "@/lib/page-metadata"

export default async function LoginPage() {
  await requireUnauth()
  return <LoginForm oauthProviders={getEnabledOAuthProviders()} />
}

export const generateMetadata = () => authTitle("login")
