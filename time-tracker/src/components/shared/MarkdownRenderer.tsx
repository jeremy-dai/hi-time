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
          h1: ({ children }) => (
            <h1 className="text-xl md:text-2xl font-bold mt-6 md:mt-8 mb-3 md:mb-4 text-gray-900 first:mt-0 tracking-tight leading-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg md:text-xl font-bold mt-6 md:mt-7 mb-3 text-gray-900 first:mt-0 tracking-tight leading-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base md:text-lg font-semibold mt-5 md:mt-6 mb-2 text-gray-900 first:mt-0 tracking-tight">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mt-4 mb-2 text-gray-900 tracking-tight">{children}</h4>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3 md:mb-4">{children}</p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc ml-5 md:ml-6 mb-3 md:mb-4 space-y-1.5 text-sm md:text-base text-gray-700">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal ml-5 md:ml-6 mb-3 md:mb-4 space-y-1.5 text-sm md:text-base text-gray-700">{children}</ol>
          ),
          li: ({ children, className }) => {
            // Task list items have a "task-list-item" class from remark-gfm
            const isTaskItem = className?.includes('task-list-item')
            return (
              <li className={isTaskItem ? 'list-none -ml-6' : ''}>
                {children}
              </li>
            )
          },
          // Task list checkboxes
          input: ({ checked, disabled }) => (
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              className="mr-2 align-middle accent-emerald-600"
            />
          ),
          // Code blocks
          pre: ({ children }) => (
            <pre className="bg-gray-900 text-gray-100 p-3 md:p-4 rounded-xl overflow-x-auto my-3 md:my-4 text-xs md:text-sm">{children}</pre>
          ),
          code: ({ className, children }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-emerald-50 text-emerald-700 px-1.5 md:px-2 py-0.5 rounded text-xs md:text-sm font-mono">
                  {children}
                </code>
              )
            }
            // Block code (inside <pre>)
            return <code className={className}>{children}</code>
          },
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300 rounded-xl overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-100">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-200">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-3 md:px-4 py-2 text-left font-semibold text-gray-900 text-xs md:text-sm">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-3 md:px-4 py-2 text-gray-700 text-xs md:text-sm">
              {children}
            </td>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-emerald-500 pl-3 md:pl-4 py-2 my-3 md:my-4 italic text-gray-600 bg-emerald-50 rounded-r-xl text-sm md:text-base">
              {children}
            </blockquote>
          ),
          // Horizontal rules
          hr: () => (
            <hr className="my-6 md:my-8 border-t-2 border-gray-200" />
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 underline font-medium"
            >
              {children}
            </a>
          ),
          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          // Emphasis/Italic
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
