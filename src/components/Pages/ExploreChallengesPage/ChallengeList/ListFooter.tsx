import { LoadMoreFooter } from '@/components/shared/LoadMoreFooter'
import { useIntl } from '@/i18n'
import { useChallengeResultsContext } from '../contexts/ChallengeResultsContext'

export const ListFooter = () => {
  const { t } = useIntl()
  const { challenges, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useChallengeResultsContext()

  if (!hasNextPage && challenges.length === 0) return null

  return (
    <LoadMoreFooter
      hasNextPage={hasNextPage}
      isFetching={isFetchingNextPage}
      onLoadMore={fetchNextPage}
      endOfListHint={t(
        'exploreChallenges.challengeList.footer.endOfListHint',
        undefined,
        'Adjust your filters or explore a different area to discover more challenges'
      )}
      className={hasNextPage ? undefined : 'pb-12'}
    />
  )
}
