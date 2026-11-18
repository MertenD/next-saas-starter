import RegisterForm from "@/features/auth/register-form"
import { requireUnauth } from "@/lib/auth-utils"
import { getEnabledOAuthProviders } from "@/lib/oauth-providers"
import { authTitle } from "@/lib/page-metadata"

export default async function SignupPage() {
  await requireUnauth()
  return <RegisterForm oauthProviders={getEnabledOAuthProviders()} />
}

export const generateMetadata = () => authTitle("register")
