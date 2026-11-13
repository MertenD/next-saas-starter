"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type MarkdownContentProps = {
  content: string
}

/**
 * Renders Markdown (GitHub-flavored: tables, task lists, strikethrough) with
 * the app's design tokens. Use it for LLM output or any user-authored rich
 * text. Raw HTML in the source is not rendered (react-markdown escapes it),
 * so it is safe for untrusted model output. Used by the AI chat demo.
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node: _node, ...props }) => (
          <h1 className="mb-3 font-bold text-display-sm" {...props} />
        ),
        h2: ({ node: _node, ...props }) => (
          <h2 className="mb-2 font-semibold text-title-md" {...props} />
        ),
        h3: ({ node: _node, ...props }) => (
          <h3 className="mb-2 font-semibold text-body-sm" {...props} />
        ),
        p: ({ node: _node, ...props }) => (
          <p className="mb-2 last:mb-0" {...props} />
        ),
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
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
