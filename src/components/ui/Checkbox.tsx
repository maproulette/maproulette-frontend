import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon, MinusIcon } from 'lucide-react'
import type * as React from 'react'

import { cn } from '@/lib/utils'

interface CheckboxProps extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  indeterminate?: boolean
}

export const Checkbox = ({ className, indeterminate, checked, ...props }: CheckboxProps) => {
  // When indeterminate, we need to ensure checked is not true
  const effectiveChecked = indeterminate ? false : checked

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-indeterminate={indeterminate}
      checked={effectiveChecked}
      className={cn(
        'peer aspect-square size-4 shrink-0 rounded border border-zinc-300 text-blue-600 shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-zinc-950 focus-visible:ring-[3px] focus-visible:ring-zinc-950/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-red-500/20 data-[indeterminate=true]:border-blue-600 data-[state=checked]:border-blue-600 data-[indeterminate=true]:bg-blue-600 data-[state=checked]:bg-blue-600 data-[indeterminate=true]:text-white data-[state=checked]:text-white dark:border-slate-600 dark:bg-slate-800 dark:data-[indeterminate=true]:border-blue-500 dark:data-[state=checked]:border-blue-500 dark:data-[indeterminate=true]:bg-blue-500 dark:data-[state=checked]:bg-blue-500 dark:aria-invalid:border-red-900 dark:aria-invalid:ring-red-500/40 dark:aria-invalid:ring-red-900/20 dark:focus-visible:border-zinc-300 dark:focus-visible:ring-zinc-300/50',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="relative flex items-center justify-center text-current"
      >
        {indeterminate ? <MinusIcon className="size-3.5" /> : <CheckIcon className="size-3.5" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
