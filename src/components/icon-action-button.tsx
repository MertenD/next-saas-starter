import type * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Small circular icon-only button for inline actions (copy, regenerate, edit),
 * the `icon-button-circle` of DESIGN.md at 32px. Always pass an `aria-label`.
 * Used by `CopyButton` and the AI chat demo's message actions.
 */
export function IconActionButton({
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  )
}
