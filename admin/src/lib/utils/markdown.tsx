import ReactMarkdown from "react-markdown";

/**
 * Renders a markdown string as styled React elements.
 * Used in Blog, Tutorials, Projects detail views.
 */
export function renderMarkdown(content: string) {
  if (!content?.trim()) {
    return (
      <p className="text-sm text-zinc-400 italic">No content yet.</p>
    );
  }

  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold text-zinc-900 mt-6 mb-3 leading-tight">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold text-zinc-900 mt-5 mb-2.5 leading-snug">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold text-zinc-800 mt-4 mb-2">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-sm text-zinc-700 leading-relaxed mb-4">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-zinc-900">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-zinc-600">{children}</em>
        ),
        code: ({ inline, children }: any) =>
          inline ? (
            <code className="bg-zinc-50 text-zinc-700 rounded px-1.5 py-0.5 text-[0.82em] font-mono">
              {children}
            </code>
          ) : (
            <pre className="bg-zinc-900 text-zinc-100 rounded-xl p-4 overflow-x-auto my-4 text-sm font-mono">
              <code>{children}</code>
            </pre>
          ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-zinc-400 pl-4 my-4 italic text-zinc-500">
            {children}
          </blockquote>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 my-3 text-sm text-zinc-700">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 my-3 text-sm text-zinc-700">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-700 hover:text-zinc-700 underline underline-offset-2"
          >
            {children}
          </a>
        ),
        hr: () => <hr className="border-zinc-200 my-6" />,
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-zinc-200 px-3 py-2 bg-zinc-50 font-semibold text-zinc-700 text-left">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border border-zinc-200 px-3 py-2 text-zinc-600">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
