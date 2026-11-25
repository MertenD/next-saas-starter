"use client"

import { Trash2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { CriticalConfirmDialog } from "@/components/critical-confirm-dialog"
import { useDashboard } from "@/components/dashboard-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDeleteAccount } from "@/features/privacy/hooks/use-delete-account"

/**
 * "Delete my account" (GDPR erasure). The user retypes their email in a
 * `CriticalConfirmDialog`, then receives a confirmation link by email: the
 * account is only deleted when that link is opened. When billing is
 * configured the texts also say what happens to the subscription.
 */
export function DeleteAccountCard() {
  const t = useTranslations("settings.privacy.delete")
  const { user, polarEnabled } = useDashboard()
  const [open, setOpen] = useState(false)
  const { mutate, isPending } = useDeleteAccount()

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {polarEnabled && (
          <p className="text-body-sm text-muted-foreground">
            {t("billingNote")}
          </p>
        )}
        <Button variant="destructive" onClick={() => setOpen(true)}>
          <Trash2Icon />
          {t("button")}
        </Button>
      </CardContent>

      <CriticalConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("dialogTitle")}
        description={
          polarEnabled
            ? `${t("dialogDescription")} ${t("billingNote")}`
            : t("dialogDescription")
        }
        confirmationValue={user.email}
        confirmLabel={t("confirm")}
        isLoading={isPending}
        onConfirm={() => mutate(undefined, { onSuccess: () => setOpen(false) })}
      />
    </Card>
  )
}
