import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { MarkdownContent } from '@/components/shared/MarkdownContent'

export const ChallengeDescription = () => {
  const { challenge } = useBrowsedChallengeContext()
  const { description, blurb } = challenge
  return (
    <div className="flex flex-col gap-4">
      {description && (
        <MarkdownContent shortCodes autoLink={false}>
          {description}
        </MarkdownContent>
      )}
      {blurb && (
        <p className="break-words border-line-strong border-l-2 pl-3 text-fg-muted text-sm italic">
          {blurb}
        </p>
      )}
    </div>
  )
}
