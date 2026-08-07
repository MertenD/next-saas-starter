"use client";

import { useTranslations } from "next-intl";
import type * as React from "react";
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

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Use "destructive" for delete/remove actions. */
  variant?: "default" | "destructive";
  /** Pass a mutation's `isPending` - disables both buttons and shows a busy label. */
  isLoading?: boolean;
  /** The dialog does not auto-close - close it yourself (e.g. in the mutation's onSuccess). */
  onConfirm: () => void;
};

/**
 * Standard "Are you sure?" confirmation dialog for ordinary, low-stakes
 * destructive actions (deleting a post, a list item, anything easily
 * recreated). Per `AGENTS.md`, deletions must never fire directly off a
 * click - route them through this (or {@link CriticalConfirmDialog} for
 * harder-to-reverse actions) instead of a one-off dialog.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const t = useTranslations("common.confirmDialog");
  const resolvedConfirmLabel = confirmLabel ?? t("confirmLabel");
  const resolvedCancelLabel = cancelLabel ?? t("cancelLabel");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {resolvedCancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className={
              variant === "destructive"
                ? buttonVariants({ variant: "destructive" })
                : undefined
            }
          >
            {isLoading ? `${resolvedConfirmLabel}…` : resolvedConfirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
