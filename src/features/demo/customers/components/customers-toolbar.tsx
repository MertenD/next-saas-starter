"use client"

import { SearchIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCustomersParams } from "@/features/demo/customers/hooks/use-customers-params"
import { useCustomersSearch } from "@/features/demo/customers/hooks/use-customers-search"
import { CUSTOMER_STATUS_FILTER_OPTIONS } from "@/features/demo/customers/model/customer"

export function CustomersToolbar() {
  const t = useTranslations("customers")
  const [params, setParams] = useCustomersParams()
  const { searchValue, onSearchChange } = useCustomersSearch()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <SearchIcon className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
        />
      </div>
      <Select
        value={params.status}
        onValueChange={(value) =>
          setParams({
            status: value as (typeof CUSTOMER_STATUS_FILTER_OPTIONS)[number],
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CUSTOMER_STATUS_FILTER_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {t(`status.${option}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
