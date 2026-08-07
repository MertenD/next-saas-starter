import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind class names safely, resolving conflicting utility classes
 * (e.g. `"p-2 p-4"` -> `"p-4"`) via `tailwind-merge` after combining
 * conditional class inputs with `clsx`. Use this instead of raw string
 * concatenation whenever classes are composed conditionally or overridden
 * via props (e.g. `className`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
