import ReactMarkdown, { type Components } from 'react-markdown'
import { ShortCodeLink } from '@/components/shared/ShortCodeLink'
import { markdownRemarkPlugins } from '@/lib/markdown'
import { linkifyShortCodes } from '@/lib/shortCodes'
import { cn } from '@/lib/utils'

interface Props {
  children: string
  className?: string
}

const components: Components = {
  a: ({ href, children, ...props }) => {
    const safe = typeof href === 'string' && !/^javascript:/i.test(href)
    if (!safe) {
      return <span>{children}</span>
    }
    const isExternal = /^https?:/i.test(href as string)
    return (
      <ShortCodeLink
        {...props}
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noreferrer noopener' : undefined}
        className="text-teal-600 underline hover:text-teal-700 dark:text-teal-400"
      >
        {children}
      </ShortCodeLink>
    )
  },
  code: ({ className, children, ...props }) => (
    <code
      {...props}
      className={cn('rounded bg-zinc-100 px-1 py-0.5 text-[0.85em] dark:bg-slate-800', className)}
    >
      {children}
    </code>
  ),
}

export const CommentMarkdown = ({ children, className }: Props) => {
  const linkified = linkifyShortCodes(children ?? '')
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown remarkPlugins={markdownRemarkPlugins} components={components}>
        {linkified}
      </ReactMarkdown>
    </div>
  )
}
