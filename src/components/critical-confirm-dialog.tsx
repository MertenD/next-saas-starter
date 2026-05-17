"use client";

import { useTranslations } from "next-intl";
import type * as React from "react";
import { useEffect, useId, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CriticalConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  /** The exact string the user must retype (e.g. the item's name) to enable the confirm button. */
  confirmationValue: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Pass a mutation's `isPending` - disables both buttons and shows a busy label. */
  isLoading?: boolean;
  /** The dialog does not auto-close - close it yourself (e.g. in the mutation's onSuccess). */
  onConfirm: () => void;
};

/**
 * Destructive, hard-to-reverse confirmation (delete account, delete org, ...).
 * The confirm button stays disabled until the user retypes `confirmationValue` exactly.
 */
export function CriticalConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmationValue,
  confirmLabel,
  cancelLabel,
  isLoading = false,
  onConfirm,
}: CriticalConfirmDialogProps) {
  const t = useTranslations("common.criticalConfirmDialog");
  const resolvedConfirmLabel = confirmLabel ?? t("confirmLabel");
  const resolvedCancelLabel = cancelLabel ?? t("cancelLabel");
  const inputId = useId();
  const [typedValue, setTypedValue] = useState("");

  useEffect(() => {
    if (!open) setTypedValue("");
  }, [open]);

  const isMatch = typedValue === confirmationValue;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor={inputId}>
            {t("typeToConfirmPrefix")}{" "}
            <span className="font-semibold text-foreground">
              {confirmationValue}
            </span>{" "}
            {t("typeToConfirmSuffix")}
          </Label>
          <Input
            id={inputId}
            value={typedValue}
            onChange={(e) => setTypedValue(e.target.value)}
            autoComplete="off"
            disabled={isLoading}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {resolvedCancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={!isMatch || isLoading}
            className={buttonVariants({ variant: "destructive" })}
          >
            {isLoading ? `${resolvedConfirmLabel}…` : resolvedConfirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
