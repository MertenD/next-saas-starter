"use client"

import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

type MarkdownRendererProps = {
  content: string
}

const REMARK_PLUGINS = [remarkGfm]

/**
 * Element overrides with the app's design tokens. Module-level constant so
 * react-markdown receives the same object on every render (it is re-rendered
 * on every streamed chunk of an AI answer).
 */
const COMPONENTS: Components = {
  h1: ({ node: _node, ...props }) => (
    <h1 className="mb-3 font-bold text-display-sm" {...props} />
  ),
  h2: ({ node: _node, ...props }) => (
    <h2 className="mb-2 font-semibold text-title-md" {...props} />
  ),
  h3: ({ node: _node, ...props }) => (
    <h3 className="mb-2 font-semibold text-body-sm" {...props} />
  ),
  p: ({ node: _node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
  ul: ({ node: _node, ...props }) => (
    <ul className="mb-2 list-disc pl-5" {...props} />
  ),
  ol: ({ node: _node, ...props }) => (
    <ol className="mb-2 list-decimal pl-5" {...props} />
  ),
  li: ({ node: _node, ...props }) => <li className="mb-1" {...props} />,
  a: ({ node: _node, ...props }) => (
    <a
      className="text-primary underline underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  code: ({ node: _node, ...props }) => (
    <code
      className="rounded bg-background px-1 py-0.5 font-mono text-xs"
      {...props}
    />
  ),
  pre: ({ node: _node, ...props }) => (
    <pre
      className="mb-2 overflow-x-auto rounded-md bg-background p-3 text-xs"
      {...props}
    />
  ),
  blockquote: ({ node: _node, ...props }) => (
    <blockquote
      className="mb-2 border-l-2 pl-3 text-muted-foreground"
      {...props}
    />
  ),
  hr: ({ node: _node, ...props }) => (
    <hr className="my-3 border-border" {...props} />
  ),
  table: ({ node: _node, ...props }) => (
    <div className="mb-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs" {...props} />
    </div>
  ),
  th: ({ node: _node, ...props }) => (
    <th className="border px-2 py-1 text-left font-semibold" {...props} />
  ),
  td: ({ node: _node, ...props }) => (
    <td className="border px-2 py-1" {...props} />
  ),
}

/**
 * The actual `react-markdown` + `remark-gfm` renderer with the app's design
 * tokens. Heavy, so never import it directly - use `MarkdownContent`
 * (`markdown-content.tsx`), which loads it lazily.
 */
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={COMPONENTS}>
      {content}
    </ReactMarkdown>
  )
}
