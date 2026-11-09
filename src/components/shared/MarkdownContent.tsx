import ReactMarkdown, { type Components } from 'react-markdown'
import { ShortCodeLink } from '@/components/shared/ShortCodeLink'
import { markdownRemarkPlugins } from '@/lib/markdown'
import { linkifyShortCodes } from '@/lib/shortCodes'
import { cn } from '@/lib/utils'

const markdownClasses =
  'break-words text-sm text-zinc-700 leading-relaxed dark:text-slate-300 [&_a]:text-blue-600 [&_a]:hover:underline [&_a]:dark:text-blue-400 [&_blockquote]:my-2 [&_blockquote]:border-zinc-300 [&_blockquote]:border-l-2 [&_blockquote]:pl-2 [&_blockquote]:italic [&_blockquote]:dark:border-slate-600 [&_code]:rounded [&_code]:bg-zinc-200 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:dark:bg-slate-800 [&_:is(h1,h2,h3,h4,h5,h6)]:mt-4 [&_:is(h1,h2,h3,h4,h5,h6)]:mb-2 [&_:is(h1,h2,h3,h4,h5,h6)]:font-bold [&_:is(h1,h2,h3,h4,h5,h6)]:text-base [&_:is(h1,h2,h3,h4,h5,h6)]:text-zinc-900 [&_:is(h1,h2,h3,h4,h5,h6)]:leading-snug [&_:is(h1,h2,h3,h4,h5,h6)]:first:mt-0 [&_:is(h1,h2,h3,h4,h5,h6)]:dark:text-white [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:ml-4 [&_ol]:list-decimal [&_p]:my-1 [&_p]:first:mt-0 [&_ul]:my-1 [&_ul]:ml-4 [&_ul]:list-disc'

/** Turns bare URLs into markdown links so ReactMarkdown renders them as links. */
const autoLinkUrls = (text: string): string =>
  text.replace(/(?<!\]\()(?<!\()(https?:\/\/[^\s)<>]+)/g, (url) => `[${url}](${url})`)

const linkClassName = 'text-blue-600 hover:underline dark:text-blue-400'

const plainComponents: Components = {
  a: (props) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className={linkClassName} />
  ),
}

const shortCodeComponents: Components = {
  a: (props) => (
    <ShortCodeLink {...props} target="_blank" rel="noopener noreferrer" className={linkClassName} />
  ),
}

interface Props {
  children: string
  /** Link bare URLs found in the text (for author-written prose that isn't strict Markdown). */
  autoLink?: boolean
  shortCodes?: boolean
  className?: string
}

/** Markdown prose as MapRoulette renders it: task instructions, challenge and project text. */
export const MarkdownContent = ({
  children,
  autoLink = true,
  shortCodes = false,
  className,
}: Props) => {
  const text = shortCodes ? linkifyShortCodes(children) : children

  return (
    <div className={cn(markdownClasses, className)}>
      <ReactMarkdown
        remarkPlugins={markdownRemarkPlugins}
        components={shortCodes ? shortCodeComponents : plainComponents}
      >
        {autoLink ? autoLinkUrls(text) : text}
      </ReactMarkdown>
    </div>
  )
}
