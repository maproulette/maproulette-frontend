import { PencilLine, X } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { DisabledTooltip } from '@/components/ui/DisabledTooltip'
import { useIntl } from '@/i18n'
import { useManageProjectDetailContext } from './ManageProjectDetailContext'

export const ChallengeSelectCheckbox = ({
  challengeId,
  challengeName,
}: {
  challengeId: number
  challengeName: string
}) => {
  const { t } = useIntl()
  const { selectedChallengeIds, toggleChallengeSelected } = useManageProjectDetailContext()

  return (
    <Checkbox
      checked={selectedChallengeIds.has(challengeId)}
      onCheckedChange={() => toggleChallengeSelected(challengeId)}
      aria-label={t(
        {
          id: 'manageProjectDetail.challengeSelection.selectChallenge',
          defaultMessage: 'Select {name}',
        },
        { name: challengeName }
      )}
    />
  )
}

export const SelectAllChallengesCheckbox = () => {
  const { t } = useIntl()
  const { filteredChallenges, selectedChallengeIds, setChallengesSelected } =
    useManageProjectDetailContext()

  const visibleIds = useMemo(
    () =>
      filteredChallenges.map((challenge) => challenge.id).filter((id): id is number => id != null),
    [filteredChallenges]
  )
  const selectedVisible = visibleIds.filter((id) => selectedChallengeIds.has(id)).length
  const allSelected = visibleIds.length > 0 && selectedVisible === visibleIds.length

  return (
    <Checkbox
      checked={allSelected}
      indeterminate={selectedVisible > 0 && !allSelected}
      disabled={visibleIds.length === 0}
      onCheckedChange={() => setChallengesSelected(visibleIds, !allSelected)}
      aria-label={t({
        id: 'manageProjectDetail.challengeSelection.selectAll',
        defaultMessage: 'Select all challenges',
      })}
    />
  )
}

export const EditSelectedChallengesButton = () => {
  const { t } = useIntl()
  const { selectedChallengeIds, clearChallengeSelection, editSelectedChallenges } =
    useManageProjectDetailContext()
  const count = selectedChallengeIds.size

  return (
    <div className="flex items-center gap-1">
      <div className="min-w-0 flex-1">
        <DisabledTooltip
          show={count === 0}
          className="w-full"
          message={t({
            id: 'manageProjectDetail.challengeSelection.noneSelected',
            defaultMessage: 'Select challenges in the list to edit them together',
          })}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={count === 0}
            onClick={editSelectedChallenges}
            className="w-full justify-start gap-2 rounded-full"
          >
            <PencilLine className="h-4 w-4" />
            {t(
              {
                id: 'manageProjectDetail.challengeSelection.editSelected',
                defaultMessage:
                  '{count, plural, =0 {Edit selected challenges} one {Edit # selected challenge} other {Edit # selected challenges}}',
              },
              { count }
            )}
          </Button>
        </DisabledTooltip>
      </div>
      {count > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full"
          onClick={clearChallengeSelection}
          title={t({
            id: 'manageProjectDetail.challengeSelection.clear',
            defaultMessage: 'Clear selection',
          })}
          aria-label={t({
            id: 'manageProjectDetail.challengeSelection.clear',
            defaultMessage: 'Clear selection',
          })}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
