import { useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { ChallengeDescription } from './ChallengeDescription'
import { ChallengeFooter } from './ChallengeFooter'
import { ChallengeHeader } from './ChallengeHeader'
import { useChallengeModals } from './ChallengeModals/ChallengeModalsContext'
import { ScrollIndicator } from './ScrollIndicator'
import { useScrollIndicator } from './useScrollIndicator'

const CommentsAutoOpener = ({ shouldOpen }: { shouldOpen: boolean }) => {
  const { openComments } = useChallengeModals()
  useEffect(() => {
    if (shouldOpen) openComments()
  }, [shouldOpen, openComments])
  return null
}

export const ChallengePanel = () => {
  const { t } = useIntl()
  const { hasMoreToScroll, scrollAreaRef } = useScrollIndicator()
  const search = useRouterState({ select: (s) => s.location.search }) as { comments?: number }
  const shouldAutoOpenComments = search.comments === 1

  const [isScrolled, setIsScrolled] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  // Estimated collapsed height for the first collapse decision; refined below
  // once we've actually measured the collapsed state.
  const collapsedHeaderHeightRef = useRef<number>(60)

  // After a collapse transition settles, cache the real collapsed height so the
  // next collapse decision uses an accurate delta instead of the estimate.
  useEffect(() => {
    if (!isScrolled || !headerRef.current) return
    const id = window.setTimeout(() => {
      if (headerRef.current) {
        collapsedHeaderHeightRef.current = headerRef.current.offsetHeight
      }
    }, 550)
    return () => window.clearTimeout(id)
  }, [isScrolled])

  useEffect(() => {
    const checkScrollPosition = () => {
      if (!scrollAreaRef.current) return

      const viewportElement = scrollAreaRef.current.querySelector(
        '[data-slot="scroll-area-viewport"]'
      )
      if (!viewportElement || !(viewportElement instanceof HTMLElement)) return

      const viewport = viewportElement
      const scrollTop = viewport.scrollTop

      setIsScrolled((wasScrolled) => {
        if (wasScrolled) return scrollTop > 20
        if (scrollTop <= 20) return false
        // Guard against pointless collapse: if the header collapse would free up
        // enough height to make the content fit, the resulting scrollTop snap
        // to 0 would re-expand the header and oscillate. Only collapse when the
        // overflow exceeds the collapse delta by a safety margin.
        const expandedHeight = headerRef.current?.offsetHeight ?? 0
        const collapseDelta = Math.max(0, expandedHeight - collapsedHeaderHeightRef.current)
        const overflow = viewport.scrollHeight - viewport.clientHeight
        return overflow > collapseDelta + 24
      })
    }

    const viewportElement = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    )
    const viewport = viewportElement instanceof HTMLElement ? viewportElement : null
    if (viewport) {
      viewport.addEventListener('scroll', checkScrollPosition)
      checkScrollPosition()
    }

    return () => {
      if (viewport) {
        viewport.removeEventListener('scroll', checkScrollPosition)
      }
    }
  }, [scrollAreaRef])

  const scrollToTop = () => {
    if (!scrollAreaRef.current) return

    const viewportElement = scrollAreaRef.current.querySelector(
      '[data-slot="scroll-area-viewport"]'
    )
    if (viewportElement && viewportElement instanceof HTMLElement) {
      viewportElement.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }

  return (
    <>
      <CommentsAutoOpener shouldOpen={shouldAutoOpenComments} />
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden">
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              ref={headerRef}
              className={cn(
                'sticky top-0 z-10 w-full shrink-0 rounded-t-xl border-b backdrop-blur-md transition-all duration-500 ease-in-out',
                isScrolled
                  ? 'border-zinc-200/60 bg-white/95 shadow-md dark:border-slate-700/60 dark:bg-slate-800/95'
                  : 'border-zinc-200/40 bg-white shadow-sm dark:border-slate-700/40 dark:bg-slate-800'
              )}
            >
              <div
                className={cn(
                  'relative flex w-full min-w-0 border-0 bg-transparent px-6 text-left transition-all duration-500 ease-in-out',
                  isScrolled ? 'items-center py-3' : 'flex-col items-start pt-6 pb-4'
                )}
              >
                {isScrolled && (
                  <Button
                    variant="ghost"
                    className="absolute inset-0 z-0 h-auto cursor-pointer rounded-none border-0 bg-transparent hover:bg-zinc-100/50 dark:hover:bg-slate-800/50"
                    onClick={scrollToTop}
                    aria-label={t('common.scrollToTop', undefined, 'Scroll to top')}
                  />
                )}
                <ChallengeHeader isScrolled={isScrolled} />
              </div>
            </div>

            <div className="relative min-h-0 flex-1">
              <ScrollArea ref={scrollAreaRef} className="h-full">
                <div className="flex flex-col px-6 py-4">
                  <ChallengeDescription />
                </div>
              </ScrollArea>

              <ScrollIndicator hasMoreToScroll={hasMoreToScroll} />
            </div>
          </div>

          <ChallengeFooter />
        </div>
      </div>
    </>
  )
}
