import { useEffect, useRef, useState } from 'react'

type DrawerState = 'closed' | 'open' | 'sliding-out'

// Slightly longer than the 300ms CSS transition, so the slide-out animation
// has finished before we swap content and slide back in.
const DEFAULT_SLIDE_DURATION_MS = 320

/**
 * Drives a drawer's open / close / slide-out-and-back-in animation state
 * machine.
 *
 * - When `shouldBeOpen` is false, the drawer is closed immediately.
 * - When `shouldBeOpen` becomes true while closed, the drawer opens
 *   immediately.
 * - When `target` changes while the drawer is already open (e.g. the user
 *   selects a different task), the drawer slides out, waits `duration` ms
 *   for the CSS transition to finish, then slides back in showing the new
 *   target.
 *
 * Returns whether the drawer should currently be rendered open.
 */
export const useDrawerTransition = <T>(
  shouldBeOpen: boolean,
  target: T,
  duration: number = DEFAULT_SLIDE_DURATION_MS
): boolean => {
  const [drawerState, setDrawerState] = useState<DrawerState>('closed')

  const prevTargetRef = useRef(target)
  const drawerStateRef = useRef(drawerState)
  drawerStateRef.current = drawerState

  useEffect(() => {
    const prevTarget = prevTargetRef.current
    prevTargetRef.current = target

    if (!shouldBeOpen) {
      setDrawerState('closed')
      return
    }

    if (drawerStateRef.current === 'closed') {
      setDrawerState('open')
      return
    } else if (drawerStateRef.current === 'open' && prevTarget !== target) {
      setDrawerState('sliding-out')
      const timer = setTimeout(() => {
        setDrawerState('open')
      }, duration)
      return () => clearTimeout(timer)
    }
    return
  }, [shouldBeOpen, target, duration])

  return drawerState === 'open'
}
