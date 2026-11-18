import ForgotPasswordForm from "@/features/auth/forgot-password-form"
import { requireUnauth } from "@/lib/auth-utils"
import { authTitle } from "@/lib/page-metadata"

export default async function ForgotPasswordPage() {
  await requireUnauth()
  return <ForgotPasswordForm />
}

export const generateMetadata = () => authTitle("forgotPassword")
