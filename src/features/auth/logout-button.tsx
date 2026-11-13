"use client"

import { Button } from "@/components/ui/button"
import { useSignOut } from "@/features/auth/hooks/use-sign-out"
import { authClient } from "@/lib/auth-client"

export default function LogoutButton() {
  const { data } = authClient.useSession()
  const signOut = useSignOut()

  return (
    <Button onClick={signOut} disabled={!data}>
      Sign Out
    </Button>
  )
}
