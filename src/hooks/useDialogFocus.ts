import { type RefObject, useEffect } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Focus handling for a modal panel that stays mounted while closed: moves focus
 * into the panel when it opens, keeps Tab inside it, and restores focus when it
 * closes. The panel needs tabIndex={-1}.
 */
export const useDialogFocus = (ref: RefObject<HTMLElement | null>, open: boolean) => {
  useEffect(() => {
    const panel = ref.current
    if (!open || !panel) return

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    // Without preventScroll, focusing the panel mid-slide scrolls its container
    panel.focus({ preventScroll: true })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panel.contains(document.activeElement)) return
      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
      const first = focusable[0]
      const last = focusable.at(-1)
      if (!first || !last) {
        e.preventDefault()
      } else if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === panel)
      ) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previous?.focus({ preventScroll: true })
    }
  }, [ref, open])
}
