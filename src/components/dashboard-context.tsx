"use client"

import { createContext, useContext } from "react"

/** The signed-in user's fields that dashboard UI needs, resolved on the server. */
export type DashboardUser = {
  id: string
  name: string
  email: string
  image: string | null
  emailVerified: boolean
}

type DashboardContextValue = {
  user: DashboardUser
  /** Whether Polar billing is configured (see `isPolarEnabled` in `src/lib/polar.ts`). */
  polarEnabled: boolean
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

/**
 * Hands server-resolved data (current user, billing flag) from the
 * `(dashboard)` layout to client components, so they don't have to fetch the
 * session or a server-side constant again on the client (extra request,
 * loading flash, and a request waterfall). Mounted once in
 * `src/app/(dashboard)/layout.tsx`. The values only change on a server
 * re-render, so call `router.refresh()` after mutating the user (see
 * `useUpdateProfile`).
 */
export function DashboardProvider({
  value,
  children,
}: {
  value: DashboardContextValue
  children: React.ReactNode
}) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

/** The server-resolved dashboard data. Only usable under the `(dashboard)` layout. */
export function useDashboard() {
  const value = useContext(DashboardContext)
  if (!value) {
    throw new Error("useDashboard must be used within <DashboardProvider>")
  }
  return value
}
