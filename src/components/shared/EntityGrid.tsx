import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/Empty'

interface EntityGridProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  emptyState: {
    icon: LucideIcon
    title: string
    description: string
    actionLabel?: string
    actionTo?: string
    actionSearch?: Record<string, unknown>
  }
  getItemKey?: (item: T, index: number) => string | number
}

export const EntityGrid = <T,>({
  items,
  renderItem,
  emptyState,
  getItemKey = (_, index) => index,
}: EntityGridProps<T>) => {
  if (items.length === 0) {
    const EmptyIcon = emptyState.icon

    return (
      <Empty className="col-span-full py-16">
        <EmptyMedia>
          <EmptyIcon className="h-16 w-16 text-zinc-300 dark:text-slate-700" />
        </EmptyMedia>
        <EmptyContent>
          <EmptyTitle>{emptyState.title}</EmptyTitle>
          <EmptyDescription>{emptyState.description}</EmptyDescription>
          {emptyState.actionLabel && emptyState.actionTo && (
            <Button asChild>
              <Link to={emptyState.actionTo} search={emptyState.actionSearch}>
                {emptyState.actionLabel}
              </Link>
            </Button>
          )}
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <>
      {items.map((item, index) => (
        <div key={getItemKey(item, index)}>{renderItem(item, index)}</div>
      ))}
    </>
  )
}
