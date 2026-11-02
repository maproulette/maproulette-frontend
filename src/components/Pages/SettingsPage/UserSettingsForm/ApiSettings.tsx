import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/Field'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { FieldApiKey } from './FieldApiKey'

export const ApiSettings = () => {
  const { t } = useIntl()
  const { user } = useAuthContext()

  return (
    <FieldSet className="min-h-0 flex-auto">
      <FieldLegend>API</FieldLegend>
      <FieldDescription>
        {t({
          id: 'settings.api.description',
          defaultMessage: 'Manage your API preferences.',
        })}
      </FieldDescription>
      <FieldGroup className="min-h-0 flex-auto overflow-y-auto px-1">
        <FieldApiKey apiKey={user?.apiKey ?? ''} userId={user?.id} />
      </FieldGroup>
    </FieldSet>
  )
}
