import { CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

interface LoadMoreFooterProps {
  hasNextPage: boolean
  isFetching: boolean
  onLoadMore: () => void
  endOfListHint?: ReactNode
  showEndOfList?: boolean
  size?: 'default' | 'sm'
  className?: string
}

export const LoadMoreFooter = ({
  hasNextPage,
  isFetching,
  onLoadMore,
  endOfListHint,
  showEndOfList = true,
  size = 'default',
  className,
}: LoadMoreFooterProps) => {
  const { t } = useIntl()

  if (hasNextPage) {
    return (
      <div className={cn('flex justify-center p-4', className)}>
        <Button
          type="button"
          variant="outline"
          size={size}
          className="rounded-full"
          onClick={onLoadMore}
          disabled={isFetching}
        >
          {isFetching ? (
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

  if (!showEndOfList) return null

  return (
    <div
      className={cn(
        'mt-4 flex flex-col items-center gap-2 border-zinc-200 border-t p-6 text-center dark:border-slate-700',
        className
      )}
    >
      <CheckCircle2 className="h-5 w-5 text-zinc-400 dark:text-slate-500" />
      <p className="font-medium text-sm text-zinc-600 dark:text-slate-400">
        {t('common.youveReachedTheEndOfTheList', undefined, "You've reached the end of the list")}
      </p>
      {endOfListHint && (
        <p className="text-xs text-zinc-500 dark:text-slate-500">{endOfListHint}</p>
      )}
    </div>
  )
}
