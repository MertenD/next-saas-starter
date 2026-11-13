"use client"

import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PackageOpenIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import type React from "react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"

/*
 * Reusable building blocks for list/"entity" pages (header + search +
 * content + pagination + empty/error states). They are presentational and
 * data-agnostic - wire them to your own params hook and query. The reference
 * usage is the pagination demo (`src/features/demo/pagination`, route
 * `/demo/pagination`).
 */

type EntityHeaderProps = {
  title: string
  description?: string
  disabled?: boolean
  isCreating?: boolean
} & (
  | { onNew: () => void; newButtonHref?: never; newButtonLabel: string }
  | { newButtonHref: string; onNew?: never; newButtonLabel: string }
  | { onNew?: never; newButtonHref?: never; newButtonLabel?: never }
)

/** Page title + optional description, with an optional "new" button (click handler *or* link). */
export function EntityHeader({
  title,
  description,
  newButtonLabel,
  disabled,
  isCreating,
  onNew,
  newButtonHref,
}: EntityHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between gap-x-4">
      <div className="flex flex-col">
        <h1 className="font-bold text-2xl">{title}</h1>
        {description && (
          <p className="mt-1 text-body-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {onNew && !newButtonHref && (
        <Button disabled={isCreating || disabled} size="sm" onClick={onNew}>
          <PlusIcon />
          {newButtonLabel}
        </Button>
      )}
      {newButtonHref && !onNew && (
        <Button size="sm" asChild>
          <Link href={newButtonHref} prefetch>
            <PlusIcon />
            {newButtonLabel}
          </Link>
        </Button>
      )}
    </div>
  )
}

type EntityContainerProps = {
  children: React.ReactNode
  header?: React.ReactNode
  search?: React.ReactNode
  pagination?: React.ReactNode
}

/** Page-level layout: header on top, search above the content, pagination below. */
export function EntityContainer({
  children,
  header,
  search,
  pagination,
}: EntityContainerProps) {
  return (
    <main className="flex flex-col gap-6 p-6">
      {header}
      <div className="flex flex-col gap-y-4">
        {search}
        {children}
      </div>
      {pagination}
    </main>
  )
}

type EntitySearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/** Controlled search input. Combine with `useEntitySearch` for debounced URL-backed search. */
export function EntitySearch({
  value,
  onChange,
  placeholder,
}: EntitySearchProps) {
  const t = useTranslations("entity")

  return (
    <div className="relative w-full sm:max-w-xs">
      <SearchIcon className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
      <Input
        className="pl-9"
        placeholder={placeholder ?? t("searchPlaceholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

type EntityPaginationProps = {
  page: number
  totalPages: number
  totalCount?: number
  onPageChange: (newPage: number) => void
  disabled?: boolean
}

/** Previous/next pagination with a "Page x of y" label and an optional result count. */
export function EntityPagination({
  page,
  totalPages,
  totalCount,
  onPageChange,
  disabled,
}: EntityPaginationProps) {
  const t = useTranslations("entity")
  const pages = Math.max(1, totalPages)

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-body-sm text-muted-foreground">
        {totalCount !== undefined && t("resultsCount", { count: totalCount })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || disabled}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeftIcon />
          {t("previous")}
        </Button>
        <span className="px-2 text-body-sm text-muted-foreground">
          {t("pageOf", { page, totalPages: pages })}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages || disabled}
          onClick={() => onPageChange(Math.min(pages, page + 1))}
        >
          {t("next")}
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  )
}

type ErrorViewProps = {
  message?: string
  onRetry?: () => void
}

/** Error state: plain-language message plus a retry action. */
export function ErrorView({ message, onRetry }: ErrorViewProps) {
  const t = useTranslations("entity")

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertTriangleIcon />
        </EmptyMedia>
        <EmptyTitle>{t("errorTitle")}</EmptyTitle>
        <EmptyDescription>{message ?? t("errorDescription")}</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          {t("retry")}
        </Button>
      )}
    </Empty>
  )
}

type EmptyViewProps = {
  title?: string
  message?: string
  /** Call to action (e.g. "Clear filters" or "Create item"). Always provide one. */
  action?: { label: string; onClick: () => void }
}

/** Empty state: nothing to show. Pass an `action` so the user always has a next step. */
export function EmptyView({ title, message, action }: EmptyViewProps) {
  const t = useTranslations("entity")

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PackageOpenIcon />
        </EmptyMedia>
        <EmptyTitle>{title ?? t("emptyTitle")}</EmptyTitle>
        {message && <EmptyDescription>{message}</EmptyDescription>}
      </EmptyHeader>
      {action && (
        <Button variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Empty>
  )
}
