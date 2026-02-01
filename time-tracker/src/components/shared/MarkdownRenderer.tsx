import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Headings
          h1: ({ children }: any) => (
            <h1 className="text-lg md:text-xl font-bold mt-6 md:mt-8 mb-3 md:mb-4 text-gray-900 first:mt-0 tracking-tight leading-tight">{children}</h1>
          ),
          h2: ({ children }: any) => (
            <h2 className="text-base md:text-lg font-bold mt-6 md:mt-7 mb-3 text-gray-900 first:mt-0 tracking-tight leading-tight">{children}</h2>
          ),
          h3: ({ children }: any) => (
            <h3 className="text-sm md:text-base font-semibold mt-5 md:mt-6 mb-2 text-gray-900 first:mt-0 tracking-tight">{children}</h3>
          ),
          h4: ({ children }: any) => (
            <h4 className="text-sm font-semibold mt-4 mb-2 text-gray-900 tracking-tight">{children}</h4>
          ),
          // Paragraphs
          p: ({ children }: any) => (
            <p className="text-xs md:text-sm text-gray-700 leading-relaxed mb-3 md:mb-4">{children}</p>
          ),
          // Lists
          ul: ({ children }: any) => (
            <ul className="list-disc ml-5 md:ml-6 mb-3 md:mb-4 space-y-1.5 text-xs md:text-sm text-gray-700">{children}</ul>
          ),
          ol: ({ children }: any) => (
            <ol className="list-decimal ml-5 md:ml-6 mb-3 md:mb-4 space-y-1.5 text-xs md:text-sm text-gray-700">{children}</ol>
          ),
          li: ({ children, className }: any) => {
            // Task list items have a "task-list-item" class from remark-gfm
            const isTaskItem = className?.includes('task-list-item')
            return (
              <li className={isTaskItem ? 'list-none -ml-6' : ''}>
                {children}
              </li>
            )
          },
          // Task list checkboxes
          input: ({ checked, disabled }: any) => (
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              className="mr-2 align-middle accent-emerald-600"
            />
          ),
          // Code blocks
          pre: ({ children }: any) => (
            <pre className="bg-gray-900 text-gray-100 p-3 md:p-4 rounded-xl overflow-x-auto my-3 md:my-4 text-2xs md:text-xs">{children}</pre>
          ),
          code: ({ className, children }: any) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-emerald-50 text-emerald-700 px-1.5 md:px-2 py-0.5 rounded text-2xs md:text-xs font-mono">
                  {children}
                </code>
              )
            }
            // Block code (inside <pre>)
            return <code className={className}>{children}</code>
          },
          // Tables
          table: ({ children }: any) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300 rounded-xl overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }: any) => (
            <thead className="bg-gray-100">{children}</thead>
          ),
          tbody: ({ children }: any) => (
            <tbody className="divide-y divide-gray-200">{children}</tbody>
          ),
          tr: ({ children }: any) => (
            <tr className="hover:bg-gray-50">{children}</tr>
          ),
          th: ({ children }: any) => (
            <th className="border border-gray-300 px-3 md:px-4 py-2 text-left font-semibold text-gray-900 text-2xs md:text-xs">
              {children}
            </th>
          ),
          td: ({ children }: any) => (
            <td className="border border-gray-300 px-3 md:px-4 py-2 text-gray-700 text-2xs md:text-xs">
              {children}
            </td>
          ),
          // Blockquotes
          blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-emerald-500 pl-3 md:pl-4 py-2 my-3 md:my-4 italic text-gray-600 bg-emerald-50 rounded-r-xl text-xs md:text-sm">
              {children}
            </blockquote>
          ),
          // Horizontal rules
          hr: () => (
            <hr className="my-6 md:my-8 border-t-2 border-gray-200" />
          ),
          // Links
          a: ({ href, children }: any) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 underline font-medium"
            >
              {children}
            </a>
          ),
          // Strong/Bold (highlighter marker style)
          strong: ({ children }: any) => (
            <strong className="bg-green-200/60 px-1 py-0.5 rounded-sm font-normal text-gray-900 decoration-clone">{children}</strong>
          ),
          // Emphasis/Italic
          em: ({ children }: any) => (
            <em className="italic">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
