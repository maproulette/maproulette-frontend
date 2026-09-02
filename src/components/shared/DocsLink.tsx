import { BookOpen } from 'lucide-react'
import type * as React from 'react'
import { type DocsPage, docsUrl } from '@/lib/docs'
import { cn } from '@/lib/utils'

interface DocsLinkProps extends Omit<React.ComponentProps<'a'>, 'href' | 'target' | 'rel'> {
  /** Documentation page to link to; omit to link to the docs home page. */
  page?: DocsPage
  /**
   * Icon rendered before the link text. Defaults to a book; pass `null` for a
   * text-only link.
   */
  icon?: React.ReactNode
  /**
   * Accessible name. Required when there is no visible text (icon-only links),
   * where it also becomes the tooltip.
   */
  label?: string
}

/**
 * Link into the documentation site, opened in a new tab. The href is resolved
 * at render time from the configured docs base URL (see src/lib/docs.ts).
 */
export const DocsLink = ({ page, icon, label, className, children, ...props }: DocsLinkProps) => {
  const iconOnly = children === undefined
  const resolvedIcon =
    icon === undefined ? <BookOpen className="size-3.5 shrink-0" aria-hidden="true" /> : icon

  return (
    <a
      href={docsUrl(page)}
      target="_blank"
      rel="noreferrer"
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      className={cn('link inline-flex items-center gap-1.5', className)}
      {...props}
    >
      {resolvedIcon}
      {children}
    </a>
  )
}
