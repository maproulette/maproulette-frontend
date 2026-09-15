import { useLoaderData } from '@tanstack/react-router'
import { useEffect } from 'react'
import { BrowsedChallengeProvider } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { BrowsedChallengeSearchContextProvider } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeSearchContext'
import { DrawerPortalProvider } from '@/components/TaskInfoPanel/DrawerPortalContext'
import { useSetPageTitle } from '@/contexts/ChromeContext'
import { markChallengeDescriptionSeen } from '@/lib/challengeDescriptionSeen'
import { BrowsedChallengePageContent } from './BrowsedChallengePageContent'

export const BrowsedChallengePage = () => {
  const { challenge } = useLoaderData({ from: '/_app/challenge/$challengeId/' })
  useSetPageTitle(challenge?.name ?? null)

  // Being here is reading the description (it's on the panel), so tasks started from this
  // challenge don't get held up by the task page's entry gate.
  useEffect(() => {
    markChallengeDescriptionSeen(challenge?.id)
  }, [challenge?.id])

  return (
    <BrowsedChallengeSearchContextProvider>
      <BrowsedChallengeProvider>
        <DrawerPortalProvider>
          <BrowsedChallengePageContent />
        </DrawerPortalProvider>
      </BrowsedChallengeProvider>
    </BrowsedChallengeSearchContextProvider>
  )
}
