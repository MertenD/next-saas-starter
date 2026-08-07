import { Suspense } from "react"
import { Spinner } from "@/components/ui/spinner"
import ResetPasswordForm from "@/features/auth/reset-password-form"
import { requireUnauth } from "@/lib/auth-utils"

export default async function ResetPasswordPage() {
  await requireUnauth()
  return (
    <Suspense fallback={<Spinner className="size-6" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
