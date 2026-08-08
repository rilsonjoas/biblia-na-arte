import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface MarkdownProps {
  content: string
  className?: string
}

// Renderiza descrições vindas do vault (markdown curado, sem HTML cru —
// react-markdown escapa HTML por padrão, então é seguro). Sem depender do
// plugin de typography do Tailwind; os estilos vêm dos componentes abaixo.
export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="leading-relaxed text-foreground/80">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed text-foreground/80">{children}</li>,
          h1: ({ children }) => <h1 className="text-display text-2xl font-bold">{children}</h1>,
          h2: ({ children }) => <h2 className="text-display text-xl font-bold">{children}</h2>,
          h3: ({ children }) => <h3 className="text-display text-lg font-semibold">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-4 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
