"use client"

import { useFormatter, useTranslations } from "next-intl"
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
import { isAdminRole, isOwnerRole } from "@/config/constants"
import { UserActions } from "@/features/admin/components/user-actions"
import { useAdminUsers } from "@/features/admin/hooks/use-admin-users"
import { useAdminUsersParams } from "@/features/admin/hooks/use-admin-users-params"
import { cn } from "@/lib/utils"

export function UsersTable() {
  const t = useTranslations("admin.users")
  const format = useFormatter()
  const { data, isPending, isError, isFetching, refetch } = useAdminUsers()
  const [, setParams] = useAdminUsersParams()

  if (isPending) {
    return (
      <div className="space-y-2 rounded-md border p-4">
        {Array.from({ length: 8 }, (_, i) => i).map((i) => (
          <Skeleton key={`user-row-skeleton-${i}`} className="h-10 w-full" />
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
          label: t("clearSearch"),
          onClick: () => setParams({ search: "", page: 1 }),
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
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.email")}</TableHead>
            <TableHead>{t("columns.role")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
            <TableHead>{t("columns.createdAt")}</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">{t("columns.actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {user.email}
              </TableCell>
              <TableCell>
                <Badge variant={isAdminRole(user.role) ? "default" : "outline"}>
                  {isOwnerRole(user.role)
                    ? t("role.owner")
                    : isAdminRole(user.role)
                      ? t("role.admin")
                      : t("role.user")}
                </Badge>
              </TableCell>
              <TableCell>
                {user.banned ? (
                  <Badge variant="destructive">{t("status.banned")}</Badge>
                ) : (
                  <Badge variant="secondary">
                    {user.emailVerified
                      ? t("status.verified")
                      : t("status.unverified")}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format.dateTime(user.createdAt, { dateStyle: "medium" })}
              </TableCell>
              <TableCell>
                {/* Reserves the height of the 48px icon button, so rows without actions (yourself, owners) are not shorter */}
                <div className="flex h-12 items-center justify-end">
                  <UserActions user={user} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
