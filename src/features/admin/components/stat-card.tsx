import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type StatCardProps = {
  label: string
  value: string
  /** Small explanation under the value, e.g. the time range. */
  hint?: string
}

/** One KPI tile of the admin overview: label, big value, optional hint. */
export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-body-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <span className="text-display-md">{value}</span>
        {hint && (
          <span className="text-body-sm text-muted-foreground">{hint}</span>
        )}
      </CardContent>
    </Card>
  )
}
