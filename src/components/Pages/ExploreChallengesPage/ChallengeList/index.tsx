import { AlertCircle } from 'lucide-react'
import { ChallengeCard } from '@/components/shared/ChallengeCard'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/Empty'
import { Loader } from '@/components/ui/Loader'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { useChallengeResultsContext } from '../contexts/ChallengeResultsContext'
import { useExploreChallengesSearchContext } from '../contexts/ExploreChallengesSearchContext'
import { ChallengeActionMenu } from './ChallengeActionMenu'
import { ChallengesTableView } from './ChallengesTableView'
import { ListFooter } from './ListFooter'

export const ChallengeList = () => {
  const { t } = useIntl()
  const { viewMode } = useExploreChallengesSearchContext()
  const { challenges, error, isLoadingState, showEmptyState, showErrorState } =
    useChallengeResultsContext()

  return (
    <div className="@container relative flex h-full w-full flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          'absolute inset-0 z-10 flex items-center justify-center bg-white/5 backdrop-blur-sm transition-opacity duration-200',
          isLoadingState ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <Loader message={t({ id: 'common.loadingChallenges', defaultMessage: 'Loading challenges...' })} />
      </div>

      {showErrorState ? (
        <ScrollArea className="h-full w-full [&_[data-slot=scroll-area-scrollbar]]:hidden">
          <Empty className="p-4">
            <EmptyHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <EmptyTitle>
                {t({ id: 'exploreChallenges.challengeList.errorTitle', defaultMessage: 'Failed to load challenges' }
                )}
              </EmptyTitle>
              <EmptyDescription>
                {error?.message ||
                  t({ id: 'common.unexpectedErrorTryAgain', defaultMessage: 'An unexpected error occurred. Please try again.' }
                  )}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </ScrollArea>
      ) : showEmptyState ? (
        <ScrollArea className="h-full w-full [&_[data-slot=scroll-area-scrollbar]]:hidden">
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyTitle>
                {t({ id: 'common.noChallengesFound', defaultMessage: 'No challenges found' })}
              </EmptyTitle>
              <EmptyDescription>
                {t({ id: 'exploreChallenges.challengeList.emptyDescription', defaultMessage: 'Try adjusting your search filters or map bounds.' }
                )}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </ScrollArea>
      ) : challenges.length > 0 && viewMode === 'list' ? (
        <>
          <ChallengesTableView />
          <ListFooter />
        </>
      ) : challenges.length > 0 ? (
        <ScrollArea className="h-full w-full [&_[data-slot=scroll-area-scrollbar]]:hidden">
          <div
            className={cn(
              'w-full gap-4',
              viewMode === 'grid-map'
                ? 'grid @[1100px]:grid-cols-3 @[700px]:grid-cols-2 grid-cols-1'
                : 'grid'
            )}
            style={
              viewMode === 'grid-map'
                ? undefined
                : { gridTemplateColumns: 'repeat(auto-fill, minmax(485px, 1fr))' }
            }
          >
            {challenges.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                actions={<ChallengeActionMenu challenge={c} />}
              />
            ))}
          </div>
          <ListFooter />
        </ScrollArea>
      ) : null}
    </div>
  )
}
