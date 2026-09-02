import ReactMarkdown, { type Components } from 'react-markdown'
import { markdownRemarkPlugins } from '@/lib/markdown'
import { linkifyOsmShortCodes } from '@/lib/shortCodes'
import { cn } from '@/lib/utils'

interface Props {
  children: string
  className?: string
}

// A bare @mention covers the usual OSM display name. Names containing spaces
// or punctuation can't be matched that way, so they may be wrapped in square
// brackets — `[@example user]` — which is how MapRoulette has always written
// them. The bracketed form is matched first so its contents aren't cut short
// by the bare pattern.
const bracketedMentionPattern = /\[@([^\]]+)\](?!\()/g
const mentionPattern = /@([A-Za-z0-9_-]+)/g

const mentionLink = (name: string): string => `[@${name}](/search?user=${encodeURIComponent(name)})`

const linkifyMentions = (text: string): string =>
  text
    .replace(bracketedMentionPattern, (_, name) => mentionLink(name.trim()))
    .replace(mentionPattern, (_, name) => mentionLink(name))

// Mentions first: a bracketed mention would otherwise be offered to the OSM
// short-code parser, which correctly declines it, but the order makes the
// intent explicit.
const prepare = (text: string): string => linkifyOsmShortCodes(linkifyMentions(text))

const components: Components = {
  a: ({ href, children, ...props }) => {
    const safe = typeof href === 'string' && !/^javascript:/i.test(href)
    if (!safe) {
      return <span>{children}</span>
    }
    const isExternal = /^https?:/i.test(href as string)
    return (
      <a
        {...props}
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noreferrer noopener' : undefined}
        className="text-teal-600 underline hover:text-teal-700 dark:text-teal-400"
      >
        {children}
      </a>
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
  const linkified = prepare(children ?? '')
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown remarkPlugins={markdownRemarkPlugins} components={components}>
        {linkified}
      </ReactMarkdown>
    </div>
  )
}
