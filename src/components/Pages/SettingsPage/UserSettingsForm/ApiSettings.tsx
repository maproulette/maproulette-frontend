import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/Field'
import { useAuthContext } from '@/contexts/AuthContext'
import { FieldApiKey } from './FieldApiKey'

export const ApiSettings = () => {
  const { user } = useAuthContext()

  return (
    <FieldSet className="min-h-0 flex-auto">
      <FieldLegend>API</FieldLegend>
      <FieldDescription>Manage your API preferences.</FieldDescription>
      <FieldGroup className="min-h-0 flex-auto overflow-y-auto">
        <FieldApiKey apiKey={user?.apiKey ?? ''} userId={user?.id} />
      </FieldGroup>
    </FieldSet>
  )
}
