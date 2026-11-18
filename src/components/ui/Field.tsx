import { cva, type VariantProps } from 'class-variance-authority'
import { Label } from '@/components/ui/Label'
import { Separator } from '@/components/ui/Separator'
import { cn } from '@/lib/utils'

export const FieldSet = ({ className, ...props }: React.ComponentProps<'fieldset'>) => (
  <fieldset
    data-slot="field-set"
    className={cn(
      'flex flex-col gap-6',
      'has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3',
      className
    )}
    {...props}
  />
)

export const FieldLegend = ({
  className,
  variant = 'legend',
  ...props
}: React.ComponentProps<'legend'> & { variant?: 'legend' | 'label' }) => (
  <legend
    data-slot="field-legend"
    data-variant={variant}
    className={cn(
      'mb-3 font-medium',
      'data-[variant=legend]:text-base',
      'data-[variant=label]:text-sm',
      className
    )}
    {...props}
  />
)

export const FieldGroup = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="field-group"
    className={cn(
      'group/field-group flex w-full flex-col gap-6 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4',
      className
    )}
    {...props}
  />
)

export const fieldVariants = cva('group/field flex w-full gap-3 data-[invalid=true]:text-danger', {
  variants: {
    orientation: {
      vertical: ['flex-col [&>*]:w-full [&>.sr-only]:w-auto'],
      horizontal: [
        'flex-row items-center',
        '[&>[data-slot=field-label]]:flex-auto',
        'has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
      ],
      responsive: [
        'flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto',
        '@md/field-group:[&>[data-slot=field-label]]:flex-auto',
        '@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
      ],
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
})

export const Field = ({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<'fieldset'> & VariantProps<typeof fieldVariants>) => (
  <fieldset
    data-slot="field"
    data-orientation={orientation}
    className={cn(fieldVariants({ orientation }), className)}
    {...props}
  />
)

export const FieldContent = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="field-content"
    className={cn('group/field-content flex flex-1 flex-col gap-1.5 leading-snug', className)}
    {...props}
  />
)

export const FieldLabel = ({ className, ...props }: React.ComponentProps<typeof Label>) => (
  <Label
    data-slot="field-label"
    className={cn(
      'group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50',
      'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4',
      'has-data-[state=checked]:border-accent has-data-[state=checked]:bg-accent/5',
      className
    )}
    {...props}
  />
)

export const FieldTitle = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="field-label"
    className={cn(
      'flex w-fit items-center gap-2 font-medium text-sm leading-snug group-data-[disabled=true]/field:opacity-50',
      className
    )}
    {...props}
  />
)

export const FieldDescription = ({ className, ...props }: React.ComponentProps<'p'>) => (
  <p
    data-slot="field-description"
    className={cn(
      'font-normal text-fg-muted text-sm leading-normal group-has-[[data-orientation=horizontal]]/field:text-balance',
      'nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5 last:mt-0',
      '[&>a:hover]:text-fg [&>a]:underline [&>a]:underline-offset-4',
      className
    )}
    {...props}
  />
)

export const FieldSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  children?: React.ReactNode
}) => (
  <div
    data-slot="field-separator"
    data-content={!!children}
    className={cn(
      '-my-2 group-data-[variant=outline]/field-group:-mb-2 relative h-5 text-sm',
      className
    )}
    {...props}
  >
    <Separator className="absolute inset-0 top-1/2" />
    {children && (
      <span
        className="relative mx-auto block w-fit bg-panel px-2 text-fg-muted"
        data-slot="field-separator-content"
      >
        {children}
      </span>
    )}
  </div>
)

export const FieldError = ({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<'div'> & {
  errors?: Array<{ message?: string } | undefined>
}) => {
  const content = (() => {
    if (children) {
      return children
    }

    if (!errors) {
      return null
    }

    if (errors?.length === 1 && errors[0]?.message) {
      return errors[0].message
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {errors.map((error) => error?.message && <li key={error.message}>{error.message}</li>)}
      </ul>
    )
  })()

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn('font-normal text-danger text-sm', className)}
      {...props}
    >
      {content}
    </div>
  )
}
