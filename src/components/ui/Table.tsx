import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import type * as React from 'react'
import { useRef } from 'react'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { useColumnResize } from './useColumnResize'

type TableProps = {
  density?: 'default' | 'compact'
  /** Set to false when an outer element scrolls the table, so the header can stick to it. */
  scroll?: boolean
}

export const Table = ({
  className,
  ref,
  density = 'default',
  scroll = true,
  ...props
}: React.ComponentProps<'table'> & TableProps) => {
  const table = (
    <table
      ref={ref}
      data-density={density}
      className={cn('group/table w-full border-collapse text-sm', className)}
      {...props}
    />
  )
  return scroll ? <div className="relative w-full overflow-x-auto">{table}</div> : table
}

export const TableHeader = ({ className, ref, ...props }: React.ComponentProps<'thead'>) => (
  <thead
    ref={ref}
    className={cn('sticky top-0 z-10 bg-popover [&_tr]:border-b', className)}
    {...props}
  />
)

export const TableBody = ({ className, ref, ...props }: React.ComponentProps<'tbody'>) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
)

export const TableFooter = ({ className, ref, ...props }: React.ComponentProps<'tfoot'>) => (
  <tfoot
    ref={ref}
    className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
    {...props}
  />
)

export const TableRow = ({ className, ref, ...props }: React.ComponentProps<'tr'>) => (
  <tr
    ref={ref}
    className={cn(
      'border-line border-b transition-colors hover:bg-muted data-[state=selected]:bg-muted',
      className
    )}
    {...props}
  />
)

export const TableHead = ({ className, children, ref, ...props }: React.ComponentProps<'th'>) => {
  const { t } = useIntl()
  const internalRef = useRef<HTMLTableCellElement>(null)

  const setRef = (node: HTMLTableCellElement | null) => {
    internalRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) (ref as React.MutableRefObject<HTMLTableCellElement | null>).current = node
  }

  const { handleResizeMouseDown } = useColumnResize(internalRef)

  return (
    <th
      ref={setRef}
      className={cn(
        'relative min-w-[40px] px-4 py-3 text-left align-middle font-medium text-fg-muted text-xs group-data-[density=compact]/table:py-2 [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    >
      <div className="overflow-hidden text-ellipsis whitespace-nowrap">{children}</div>
      <button
        type="button"
        aria-label={t({ id: 'ui.table.resizeColumn', defaultMessage: 'Resize column' })}
        onMouseDown={handleResizeMouseDown}
        className="absolute top-0 right-0 z-20 h-full w-1 cursor-col-resize select-none border-0 bg-transparent p-0 hover:bg-accent"
      />
    </th>
  )
}

/**
 * Header cell whose label is a button that asks for the column to be sorted.
 * `sort` is the column's current direction, or false when the table isn't
 * sorted by it; the caller decides what each click does.
 */
export const SortableTableHead = ({
  sort,
  onSort,
  children,
  ...props
}: React.ComponentProps<typeof TableHead> & {
  sort: 'asc' | 'desc' | false
  onSort: () => void
}) => {
  const Icon = sort === 'asc' ? ArrowUp : sort === 'desc' ? ArrowDown : ChevronsUpDown
  return (
    <TableHead
      aria-sort={sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : 'none'}
      {...props}
    >
      <button
        type="button"
        onClick={onSort}
        className="-mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
        <Icon className={cn('size-3.5 shrink-0', !sort && 'opacity-40')} aria-hidden="true" />
      </button>
    </TableHead>
  )
}

export const TableCell = ({ className, children, ref, ...props }: React.ComponentProps<'td'>) => (
  <td
    ref={ref}
    className={cn(
      'px-4 py-3 align-middle group-data-[density=compact]/table:py-1.5 [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  >
    <div className="overflow-hidden text-ellipsis whitespace-nowrap">{children}</div>
  </td>
)

export const TableCaption = ({ className, ref, ...props }: React.ComponentProps<'caption'>) => (
  <caption ref={ref} className={cn('mt-4 text-fg-muted text-sm', className)} {...props} />
)
