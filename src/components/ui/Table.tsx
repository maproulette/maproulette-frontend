import type * as React from 'react'
import { useRef } from 'react'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { useColumnResize } from './useColumnResize'

export const Table = ({ className, ref, ...props }: React.ComponentProps<'table'>) => (
  <div className="relative w-full overflow-x-auto">
    <table ref={ref} className={cn('w-full border-collapse text-sm', className)} {...props} />
  </div>
)

export const TableHeader = ({ className, ref, ...props }: React.ComponentProps<'thead'>) => (
  <thead
    ref={ref}
    className={cn('sticky top-0 z-10 bg-zinc-50 dark:bg-slate-900 [&_tr]:border-b', className)}
    {...props}
  />
)

export const TableBody = ({ className, ref, ...props }: React.ComponentProps<'tbody'>) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
)

export const TableFooter = ({ className, ref, ...props }: React.ComponentProps<'tfoot'>) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-zinc-100/50 font-medium dark:bg-slate-800/50 [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
)

export const TableRow = ({ className, ref, ...props }: React.ComponentProps<'tr'>) => (
  <tr
    ref={ref}
    className={cn(
      'border-zinc-200 border-b transition-colors hover:bg-zinc-50 data-[state=selected]:bg-zinc-100 dark:border-slate-700 dark:data-[state=selected]:bg-slate-800 dark:hover:bg-slate-800/50',
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
        'relative min-w-[40px] px-4 py-3 text-left align-middle font-medium text-xs text-zinc-600 dark:text-slate-400 [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    >
      <div className="overflow-hidden text-ellipsis whitespace-nowrap">{children}</div>
      <button
        type="button"
        aria-label={t('ui.table.resizeColumn', undefined, 'Resize column')}
        onMouseDown={handleResizeMouseDown}
        className="absolute top-0 right-0 z-20 h-full w-1 cursor-col-resize select-none border-0 bg-transparent p-0 hover:bg-blue-500"
      />
    </th>
  )
}

export const TableCell = ({ className, children, ref, ...props }: React.ComponentProps<'td'>) => (
  <td
    ref={ref}
    className={cn('px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  >
    <div className="overflow-hidden text-ellipsis whitespace-nowrap">{children}</div>
  </td>
)

export const TableCaption = ({ className, ref, ...props }: React.ComponentProps<'caption'>) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-zinc-500 dark:text-zinc-400', className)}
    {...props}
  />
)
