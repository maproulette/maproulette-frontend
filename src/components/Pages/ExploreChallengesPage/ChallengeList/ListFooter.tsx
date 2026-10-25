import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useIntl } from '@/i18n'
import { useChallengeResultsContext } from '../contexts/ChallengeResultsContext'

export const ListFooter = () => {
  const { t } = useIntl()
  const { challenges, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useChallengeResultsContext()

  if (hasNextPage) {
    return (
      <div className="flex justify-center p-4">
        <Button
          variant="outline"
          className="rounded-full"
          onClick={fetchNextPage}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? (
            <>
              <Spinner />
              {t('common.loading2', undefined, 'Loading...')}
            </>
          ) : (
            t('common.loadMore', undefined, 'Load More')
          )}
        </Button>
      </div>
    )
  }

  if (challenges.length > 0) {
    return (
      <div className="mt-4 flex flex-col items-center gap-2 border-zinc-200 border-t p-6 pb-12 text-center dark:border-slate-700">
        <CheckCircle2 className="h-5 w-5 text-zinc-400 dark:text-slate-500" />
        <p className="font-medium text-sm text-zinc-600 dark:text-slate-400">
          {t('common.youveReachedTheEndOfTheList', undefined, "You've reached the end of the list")}
        </p>
        <p className="text-xs text-zinc-500 dark:text-slate-500">
          {t(
            'exploreChallenges.challengeList.footer.endOfListHint',
            undefined,
            'Adjust your filters or explore a different area to discover more challenges'
          )}
        </p>
      </div>
    )
  }

  return null
}
