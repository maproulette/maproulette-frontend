import ReactMarkdown, { type Components } from 'react-markdown'
import { ShortCodeLink } from '@/components/shared/ShortCodeLink'
import { markdownRemarkPlugins } from '@/lib/markdown'
import { linkifyShortCodes } from '@/lib/shortCodes'
import { cn } from '@/lib/utils'

const markdownClasses =
  'break-words text-fg text-sm leading-relaxed [&_:is(h1,h2,h3,h4,h5,h6)]:mt-5 [&_:is(h1,h2,h3,h4,h5,h6)]:mb-2 [&_:is(h1,h2,h3,h4,h5,h6)]:font-semibold [&_:is(h1,h2,h3,h4,h5,h6)]:text-base [&_:is(h1,h2,h3,h4,h5,h6)]:text-fg [&_:is(h1,h2,h3,h4,h5,h6)]:leading-snug [&_:is(h1,h2,h3,h4,h5,h6)]:first:mt-0 [&_a]:text-link [&_a]:hover:underline [&_blockquote]:my-3 [&_blockquote]:border-line-strong [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-fg-muted [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_hr]:my-5 [&_hr]:border-line [&_li]:my-1 [&_ol]:my-2 [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:my-2 [&_p]:first:mt-0 [&_p]:last:mb-0 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-inset [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_strong]:text-fg [&_ul]:my-2 [&_ul]:ml-5 [&_ul]:list-disc'

/** Turns bare URLs into markdown links so ReactMarkdown renders them as links. */
const autoLinkUrls = (text: string): string =>
  text.replace(/(?<!\]\()(?<!\()(https?:\/\/[^\s)<>]+)/g, (url) => `[${url}](${url})`)

const linkClassName = 'text-link hover:underline'

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
