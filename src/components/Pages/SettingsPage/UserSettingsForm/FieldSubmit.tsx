import { Button } from '@/components/ui/Button'
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
      <Button disabled={formSubmitDisabled({ isSubmitting, isDirty })} type="submit" size="lg">
        {isSubmitting ? (
          <>
            <Spinner />
            Submitting...
          </>
        ) : (
          'Submit'
        )}
      </Button>
    </Field>
  )
}
