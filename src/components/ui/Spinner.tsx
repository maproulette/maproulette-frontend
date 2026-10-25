import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2Icon } from 'lucide-react'

import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      sm: 'size-3.5',
      md: 'size-4',
      lg: 'size-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export const Spinner = ({
  className,
  size,
  ...props
}: Omit<React.ComponentProps<'svg'>, 'size'> & VariantProps<typeof spinnerVariants>) => {
  const { t } = useIntl()

  return (
    <Loader2Icon
      role="status"
      aria-label={t('ui.spinner.loading', undefined, 'Loading')}
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  )
}
