import type { useIntl } from '@/i18n'
import type { BulkEditField } from './bulkEditPayload'

type T = ReturnType<typeof useIntl>['t']

export const bulkEditFieldLabel = (t: T, field: BulkEditField): string => {
  switch (field) {
    case 'instruction':
      return t({ id: 'manageChallengesBulkEdit.field.instruction', defaultMessage: 'Instructions' })
    case 'additionalKeywords':
      return t({
        id: 'manageChallengesBulkEdit.field.additionalKeywords',
        defaultMessage: 'Additional keywords',
      })
    case 'exportableProperties':
      return t({
        id: 'manageChallengesBulkEdit.field.exportableProperties',
        defaultMessage: 'Exportable properties',
      })
    case 'basemap':
      return t({ id: 'manageChallengesBulkEdit.field.basemap', defaultMessage: 'Basemap' })
    case 'dataOriginDate':
      return t({
        id: 'manageChallengesBulkEdit.field.dataOriginDate',
        defaultMessage: 'Data origin date',
      })
    case 'priorities':
      return t({ id: 'manageChallengesBulkEdit.field.priorities', defaultMessage: 'Priorities' })
  }
}
