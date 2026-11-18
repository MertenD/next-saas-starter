"use client"

import { isValidElement, type ReactNode } from "react"
import ReactMarkdown, { type Components, type Options } from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import remarkGfm from "remark-gfm"
import { CopyButton } from "@/components/copy-button"
import { cn } from "@/lib/utils"

type MarkdownRendererProps = {
  content: string
}

const REMARK_PLUGINS = [remarkGfm]

/** Syntax highlighting for fenced code blocks; unknown languages stay unhighlighted instead of being guessed. */
const REHYPE_PLUGINS: Options["rehypePlugins"] = [
  [rehypeHighlight, { detect: false, ignoreMissing: true }],
]

/** Plain text of a React subtree (the highlighted code is nested spans), used for the copy button. */
function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractText(node.props.children)
  }
  return ""
}

/** Language name from the `language-xxx` class that react-markdown puts on the code element. */
function getLanguage(node: ReactNode): string {
  if (!isValidElement<{ className?: string }>(node)) return ""
  return /language-(\S+)/.exec(node.props.className ?? "")?.[1] ?? ""
}

/** Fenced code block: language label and copy button above the highlighted code. */
function CodeBlock({ children }: { children?: ReactNode }) {
  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-border bg-secondary last:mb-0">
      <div className="flex items-center justify-between border-b border-border py-1 pr-1 pl-3 text-caption-sm text-muted-foreground">
        <span>{getLanguage(children)}</span>
        <CopyButton text={extractText(children).replace(/\n$/, "")} />
      </div>
      <pre className="overflow-x-auto p-3 text-body-sm [&_code]:rounded-none [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[1em]">
        {children}
      </pre>
    </div>
  )
}

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
  code: ({ node: _node, className, ...props }) => (
    <code
      className={cn(
        "rounded bg-secondary px-1 py-0.5 font-mono text-[0.9em]",
        className,
      )}
      {...props}
    />
  ),
  pre: ({ node: _node, children }) => <CodeBlock>{children}</CodeBlock>,
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
      <table className="w-full border-collapse text-body-sm" {...props} />
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
 * The actual `react-markdown` + `remark-gfm` + `rehype-highlight` renderer with the app's design
 * tokens. Heavy, so never import it directly - use `MarkdownContent`
 * (`markdown-content.tsx`), which loads it lazily.
 */
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={REMARK_PLUGINS}
      rehypePlugins={REHYPE_PLUGINS}
      components={COMPONENTS}
    >
      {content}
    </ReactMarkdown>
  )
}
