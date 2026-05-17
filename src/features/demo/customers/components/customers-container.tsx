"use client";

import { CustomersPagination } from "@/features/demo/customers/components/customers-pagination";
import { CustomersTable } from "@/features/demo/customers/components/customers-table";
import { CustomersToolbar } from "@/features/demo/customers/components/customers-toolbar";

export function CustomersContainer() {
  return (
    <div className="space-y-4">
      <CustomersToolbar />
      <CustomersTable />
      <CustomersPagination />
    </div>
  );
}
