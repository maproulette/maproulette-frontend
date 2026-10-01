import { Button } from '@/components/ui/Button'
import { DisabledTooltip } from '@/components/ui/DisabledTooltip'
import { Field } from '@/components/ui/Field'
import { formSubmitDisabled } from '@/components/ui/Form'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

export const FieldSubmit = ({
  className,
  isSubmitting,
  isDirty,
  ...props
}: React.ComponentProps<typeof Field> & {
  isSubmitting: boolean
  isDirty: boolean
}) => {
  const disabled = formSubmitDisabled({ isSubmitting, isDirty })

  return (
    <Field
      className={cn('shrink-0 border-zinc-200 border-t pt-4 dark:border-slate-700', className)}
      orientation="horizontal"
      {...props}
    >
      <DisabledTooltip show={disabled && !isSubmitting} message="No changes to save">
        <Button disabled={disabled} type="submit" size="lg">
          {isSubmitting ? (
            <>
              <Spinner />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </DisabledTooltip>
    </Field>
  )
}
