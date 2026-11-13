import LoginForm from "@/features/auth/login-form"
import { requireUnauth } from "@/lib/auth-utils"
import { getEnabledOAuthProviders } from "@/lib/oauth-providers"

export default async function LoginPage() {
  await requireUnauth()
  return <LoginForm oauthProviders={getEnabledOAuthProviders()} />
}
