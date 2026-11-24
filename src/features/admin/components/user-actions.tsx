"use client"

import { MoreHorizontalIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { CriticalConfirmDialog } from "@/components/critical-confirm-dialog"
import { useDashboard } from "@/components/dashboard-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { isAdminRole } from "@/config/constants"
import { UserBillingNotice } from "@/features/admin/components/user-billing-notice"
import { useAdminUserActions } from "@/features/admin/hooks/use-admin-user-actions"
import type { AdminUser } from "@/features/admin/model/admin-user"

type Dialog = "role" | "ban" | "delete" | null

/**
 * The per-row actions menu of the admin users table: change role, ban/unban,
 * delete. Every action except unban goes through a confirmation dialog
 * (delete requires retyping the email). Renders nothing for the admin's own row,
 * because the server refuses self-targeted actions anyway.
 */
export function UserActions({ user }: { user: AdminUser }) {
  const t = useTranslations("admin.users")
  const { user: currentUser } = useDashboard()
  const { setRole, ban, unban, remove } = useAdminUserActions()
  const [dialog, setDialog] = useState<Dialog>(null)

  if (user.id === currentUser.id) return null

  const isAdmin = isAdminRole(user.role)
  const close = () => setDialog(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("actions.label", { name: user.name })}
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("role")}>
            {isAdmin ? t("actions.makeUser") : t("actions.makeAdmin")}
          </DropdownMenuItem>
          {user.banned ? (
            <DropdownMenuItem
              disabled={unban.isPending}
              onSelect={() => unban.mutate({ userId: user.id })}
            >
              {t("actions.unban")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setDialog("ban")}>
              {t("actions.ban")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDialog("delete")}
          >
            {t("actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={dialog === "role"}
        onOpenChange={(open) => !open && close()}
        title={t("dialogs.role.title", { name: user.name })}
        description={t(
          isAdmin
            ? "dialogs.role.descriptionUser"
            : "dialogs.role.descriptionAdmin",
          { name: user.name },
        )}
        isLoading={setRole.isPending}
        onConfirm={() =>
          setRole.mutate(
            { userId: user.id, role: isAdmin ? "user" : "admin" },
            { onSuccess: close },
          )
        }
      />

      <ConfirmDialog
        open={dialog === "ban"}
        onOpenChange={(open) => !open && close()}
        title={t("dialogs.ban.title", { name: user.name })}
        description={
          <>
            {t("dialogs.ban.description", { name: user.name })}
            <UserBillingNotice userId={user.id} action="ban" />
          </>
        }
        variant="destructive"
        confirmLabel={t("actions.ban")}
        isLoading={ban.isPending}
        onConfirm={() => ban.mutate({ userId: user.id }, { onSuccess: close })}
      />

      <CriticalConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => !open && close()}
        title={t("dialogs.delete.title", { name: user.name })}
        description={
          <>
            {t("dialogs.delete.description", { name: user.name })}
            <UserBillingNotice userId={user.id} action="delete" />
          </>
        }
        confirmationValue={user.email}
        confirmLabel={t("actions.delete")}
        isLoading={remove.isPending}
        onConfirm={() =>
          remove.mutate({ userId: user.id }, { onSuccess: close })
        }
      />
    </>
  )
}
