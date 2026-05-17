"use client";

import { useQueryStates } from "nuqs";
import { customersParams } from "@/features/demo/customers/params";

export const useCustomersParams = () => useQueryStates(customersParams);
