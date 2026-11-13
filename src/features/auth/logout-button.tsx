"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { clearPwaPageCache } from "@/lib/pwa"

export default function LogoutButton() {
  const { data } = authClient.useSession()
  const router = useRouter()

  return (
    <Button
      onClick={() =>
        authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              clearPwaPageCache()
              router.push("/login")
            },
          },
        })
      }
      disabled={!data}
    >
      Sign Out
    </Button>
  )
}
