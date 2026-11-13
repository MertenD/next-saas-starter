import { Spinner } from "@/components/ui/spinner"

/**
 * Top-level loading state. Sits above the `(dashboard)` layout, which awaits
 * the session before rendering anything, so this is what users see while the
 * shell itself is being resolved.
 */
export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="size-6" />
    </div>
  )
}
