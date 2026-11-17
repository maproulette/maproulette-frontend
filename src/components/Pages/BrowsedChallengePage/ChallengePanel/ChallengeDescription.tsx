import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { MarkdownContent } from '@/components/shared/MarkdownContent'

export const ChallengeDescription = () => {
  const { challenge } = useBrowsedChallengeContext()
  const { description, blurb } = challenge
  return (
    <div className="mb-6 flex flex-col gap-4">
      {description && (
        <MarkdownContent shortCodes autoLink={false}>
          {description}
        </MarkdownContent>
      )}
      {blurb && (
        <div className="break-words rounded-lg bg-zinc-50/50 p-4 text-sm text-zinc-600 italic dark:bg-slate-800/30 dark:text-slate-400">
          {blurb}
        </div>
      )}
    </div>
  )
}
