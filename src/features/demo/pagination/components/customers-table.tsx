"use client"

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type * as React from "react"
import { EmptyView, ErrorView } from "@/components/entity-components"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCustomers } from "@/features/demo/pagination/hooks/use-customers"
import { useCustomersParams } from "@/features/demo/pagination/hooks/use-customers-params"
import type {
  CustomerSortBy,
  CustomerStatus,
} from "@/features/demo/pagination/model/customer"
import { cn } from "@/lib/utils"

const STATUS_BADGE_VARIANT: Record<
  CustomerStatus,
  "default" | "secondary" | "outline"
> = {
  active: "default",
  invited: "secondary",
  suspended: "outline",
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" })

function SortableHead({
  field,
  children,
}: {
  field: CustomerSortBy
  children: React.ReactNode
}) {
  const [params, setParams] = useCustomersParams()
  const isActive = params.sortBy === field

  return (
    <TableHead>
      <button
        type="button"
        className="flex items-center gap-1 font-medium hover:text-foreground"
        onClick={() =>
          setParams({
            sortBy: field,
            sortOrder: isActive && params.sortOrder === "asc" ? "desc" : "asc",
            page: 1,
          })
        }
      >
        {children}
        {isActive ? (
          params.sortOrder === "asc" ? (
            <ArrowUpIcon className="size-3.5" />
          ) : (
            <ArrowDownIcon className="size-3.5" />
          )
        ) : (
          <ArrowUpDownIcon className="size-3.5 text-muted-foreground" />
        )}
      </button>
    </TableHead>
  )
}

export function CustomersTable() {
  const t = useTranslations("pagination")
  const { data, isPending, isError, isFetching, refetch } = useCustomers()
  const [, setParams] = useCustomersParams()

  if (isPending) {
    return (
      <div className="space-y-2 rounded-md border p-4">
        {Array.from({ length: 8 }, (_, i) => i).map((i) => (
          <Skeleton
            key={`customer-row-skeleton-${i}`}
            className="h-10 w-full"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return <ErrorView onRetry={() => refetch()} />
  }

  if (data.items.length === 0) {
    return (
      <EmptyView
        title={t("emptyTitle")}
        message={t("emptyDescription")}
        action={{
          label: t("clearFilters"),
          onClick: () => setParams({ search: "", status: "all", page: 1 }),
        }}
      />
    )
  }

  return (
    <div
      className={cn(
        "rounded-md border transition-opacity",
        isFetching && "opacity-60",
      )}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead field="name">{t("columns.name")}</SortableHead>
            <TableHead>{t("columns.email")}</TableHead>
            <TableHead>{t("columns.plan")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
            <SortableHead field="totalSpent">
              {t("columns.totalSpent")}
            </SortableHead>
            <SortableHead field="createdAt">
              {t("columns.createdAt")}
            </SortableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {customer.email}
              </TableCell>
              <TableCell>{t(`plan.${customer.plan}`)}</TableCell>
              <TableCell>
                <Badge variant={STATUS_BADGE_VARIANT[customer.status]}>
                  {t(`status.${customer.status}`)}
                </Badge>
              </TableCell>
              <TableCell>
                {currencyFormatter.format(customer.totalSpent)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {dateFormatter.format(new Date(customer.createdAt))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
