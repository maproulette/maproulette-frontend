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
        'peer aspect-square size-4 shrink-0 rounded border border-line-strong bg-field outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-danger/20 data-[indeterminate=true]:border-accent data-[state=checked]:border-accent data-[indeterminate=true]:bg-accent data-[state=checked]:bg-accent data-[indeterminate=true]:text-white data-[state=checked]:text-white',
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
