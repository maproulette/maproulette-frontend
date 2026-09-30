import { Button } from '@/components/ui/Button'
import { DisabledTooltip } from '@/components/ui/DisabledTooltip'
import { Field } from '@/components/ui/Field'
import { formSubmitDisabled } from '@/components/ui/Form'
import { Spinner } from '@/components/ui/Spinner'

export const FieldSubmit = ({
  className,
  isSubmitting,
  isDirty,
  ...props
}: React.ComponentProps<typeof Field> & {
  isSubmitting: boolean
  isDirty: boolean
}) => {
  return (
    <Field className={className} orientation="horizontal" {...props}>
      <DisabledTooltip show={!isDirty && !isSubmitting} message="No changes to save">
        <Button disabled={formSubmitDisabled({ isSubmitting, isDirty })} type="submit" size="lg">
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
