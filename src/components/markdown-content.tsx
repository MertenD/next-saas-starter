"use client"

import dynamic from "next/dynamic"

type MarkdownContentProps = {
  content: string
}

/**
 * Lazy chunk for the Markdown parser (`react-markdown` + `remark-gfm`), so it
 * stays out of the main bundle. Renders nothing while the chunk loads.
 */
const MarkdownRenderer = dynamic(
  () =>
    import("@/components/markdown-renderer").then((m) => m.MarkdownRenderer),
  {
    loading: () => null,
  },
)

/**
 * Renders Markdown (GitHub-flavored: tables, task lists, strikethrough) with
 * the app's design tokens. Use it for LLM output or any user-authored rich
 * text. Raw HTML in the source is not rendered (react-markdown escapes it),
 * so it is safe for untrusted model output. The parser is loaded lazily via
 * `next/dynamic` (see `markdown-renderer.tsx`). Used by the AI chat demo.
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  return <MarkdownRenderer content={content} />
}
