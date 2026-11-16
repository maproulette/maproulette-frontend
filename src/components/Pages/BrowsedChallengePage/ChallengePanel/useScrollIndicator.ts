import { useEffect, useRef, useState } from 'react'
import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'

export const useScrollIndicator = () => {
  const { challenge } = useBrowsedChallengeContext()
  const [hasMoreToScroll, setHasMoreToScroll] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkScrollPosition = () => {
      if (!scrollAreaRef.current) return

      const viewportElement = scrollAreaRef.current.querySelector(
        '[data-slot="scroll-area-viewport"]'
      )
      if (!viewportElement || !(viewportElement instanceof HTMLElement)) return

      const viewport = viewportElement
      const { scrollTop, scrollHeight, clientHeight } = viewport

      const hasMore = scrollHeight - scrollTop - clientHeight > 10
      setHasMoreToScroll(hasMore)
    }

    checkScrollPosition()

    const viewportElement = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    )
    const viewport = viewportElement instanceof HTMLElement ? viewportElement : null
    if (viewport) {
      viewport.addEventListener('scroll', checkScrollPosition)
      window.addEventListener('resize', checkScrollPosition)
    }

    return () => {
      if (viewport) {
        viewport.removeEventListener('scroll', checkScrollPosition)
        window.removeEventListener('resize', checkScrollPosition)
      }
    }
  }, [challenge.description, challenge.blurb])

  return {
    hasMoreToScroll,
    scrollAreaRef,
  }
}
