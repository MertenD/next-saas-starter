import { Skeleton } from "@/components/ui/skeleton"

/**
 * Instant loading state for every page under `(dashboard)`: a skeleton shaped
 * like the typical page (title, subtitle, content card), shown while the page
 * streams in.
 */
export default function DashboardLoading() {
  return (
    <main className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </main>
  )
}
