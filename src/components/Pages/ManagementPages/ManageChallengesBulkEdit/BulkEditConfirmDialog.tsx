import { BASEMAP_CUSTOM, BASEMAP_NONE } from '@/components/Map/basemap'
import { binaryToBackendJson } from '@/components/shared/TaskPropertyQueryBuilder/backendRuleShape'
import type { BinaryNode } from '@/components/shared/TaskPropertyQueryBuilder/propertyRuleTypes'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { useIntl } from '@/i18n'
import { PRIORITY_MESSAGES } from '@/types/Priority'
import { TIER_ORDER, TIER_TO_PRIORITY } from '../TaskPrioritizationPage/PrioritizationContext'
import { useBulkEditContext } from './BulkEditContext'
import { bulkEditFieldLabel } from './bulkEditFieldLabels'
import {
  type BulkEditField,
  type BulkEditValues,
  changedBulkEditFields,
  normalizeKeywords,
} from './bulkEditPayload'

interface Props {
  values: BulkEditValues | null
  onCancel: () => void
  onConfirm: (values: BulkEditValues) => void
}

export const BulkEditConfirmDialog = ({ values, onCancel, onConfirm }: Props) => {
  const { t } = useIntl()
  const { challenges } = useBulkEditContext()

  const ruleSummary = (rules: BinaryNode | null) =>
    rules
      ? binaryToBackendJson(rules)
      : t({ id: 'manageChallengesBulkEdit.confirm.noRule', defaultMessage: 'No rule' })

  const describe = (field: BulkEditField, current: BulkEditValues): string => {
    switch (field) {
      case 'instruction':
        return current.instruction
      case 'additionalKeywords':
        return normalizeKeywords(current.additionalKeywords)
      case 'exportableProperties':
        return current.exportableProperties.trim()
      case 'basemap':
        if (current.basemap === BASEMAP_NONE) {
          return t({
            id: 'manageChallengeNew.challengeForm.basemapNone',
            defaultMessage: "Don't override — mappers use their own",
          })
        }
        return current.basemap === BASEMAP_CUSTOM ? current.basemapUrl.trim() : current.basemap
      case 'dataOriginDate':
        return current.dataOriginDate
      case 'priorities':
        return [
          `${t({
            id: 'taskPrioritizationPage.defaultPrioritySelect.label',
            defaultMessage: 'Default priority',
          })}: ${t(PRIORITY_MESSAGES[current.priorities.defaultPriority])}`,
          ...TIER_ORDER.map(
            (tier) =>
              `${t(PRIORITY_MESSAGES[TIER_TO_PRIORITY[tier]])}: ${ruleSummary(current.priorities[tier])}`
          ),
        ].join('\n')
    }
  }

  return (
    <Dialog open={values !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {t({
              id: 'manageChallengesBulkEdit.confirm.title',
              defaultMessage: 'Confirm bulk edit',
            })}
          </DialogTitle>
          <DialogDescription>
            {t(
              {
                id: 'manageChallengesBulkEdit.confirm.description',
                defaultMessage:
                  '{count, plural, one {These values will overwrite the current ones on # challenge.} other {These values will overwrite the current ones on # challenges.}}',
              },
              { count: challenges.length }
            )}
          </DialogDescription>
        </DialogHeader>
        {values && (
          <dl className="max-h-[50vh] space-y-3 overflow-y-auto text-sm">
            {changedBulkEditFields(values).map((field) => (
              <div key={field}>
                <dt className="font-medium text-zinc-900 dark:text-zinc-50">
                  {bulkEditFieldLabel(t, field)}
                </dt>
                <dd className="whitespace-pre-wrap break-all text-zinc-600 dark:text-slate-300">
                  {describe(field, values)}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t({ id: 'manageChallengesBulkEdit.confirm.cancel', defaultMessage: 'Cancel edit' })}
          </Button>
          <Button onClick={() => values && onConfirm(values)}>
            {t({
              id: 'manageChallengesBulkEdit.confirm.submit',
              defaultMessage: 'Submit bulk edit',
            })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
