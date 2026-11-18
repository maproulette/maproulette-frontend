import { Link } from '@tanstack/react-router'
import {
  Archive,
  Copy,
  Eye,
  Hammer,
  ListChecks,
  MoreHorizontal,
  PanelLeftOpen,
  Pencil,
  Pin,
  Play,
  Plus,
  Trash2,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import {
  ArchiveButton,
  DiscoverableButton,
  PauseButton,
  PinButton,
} from '@/components/Pages/ManagementPages/shared/QuickActionButtons'
import {
  getChallengeSourceType,
  RebuildTasksDialog,
} from '@/components/Pages/ManagementPages/shared/RebuildTasksDialog'
import { ChallengeCard } from '@/components/shared/ChallengeCard'
import { ClearManageFiltersButton } from '@/components/shared/ClearManageFiltersButton'
import { EntityGrid } from '@/components/shared/EntityGrid'
import { FilterToggle } from '@/components/shared/FilterToggle'
import { LoadMoreFooter } from '@/components/shared/LoadMoreFooter'
import { SearchBar } from '@/components/shared/SearchBar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useSetHeaderActions } from '@/contexts/ChromeContext'
import { useIntl } from '@/i18n'
import { isStartableChallengeStatus } from '@/lib/challengeStatus'
import { cn } from '@/lib/utils'
import type { ChallengeListing } from '@/types/Challenge'
import { ManageInfoPanel } from '../shared/ManageInfoPanel'
import { useManageChallengesContext } from './ManageChallengesContext'

export const ManageChallengesContent = () => {
  const { t } = useIntl()
  const {
    challenges,
    isLoading,
    isFetching,
    hasNextPage,
    loadMore,
    pinnedChallengeIds,
    searchQuery,
    setSearchQuery,
    onlyDiscoverable,
    setOnlyDiscoverable,
    onlyArchived,
    setOnlyArchived,
    onlyOwned,
    setOnlyOwned,
    onlyPinned,
    setOnlyPinned,
    deleteChallengeId,
    setDeleteChallengeId,
    confirmDeleteChallenge,
    toggleChallengePin,
    toggleChallengeEnabled,
    togglePaused,
    archiveChallenge,
    rebuildChallengeId,
    setRebuildChallengeId,
  } = useManageChallengesContext()

  const [showPanel, setShowPanel] = useState(true)

  useSetHeaderActions(
    <Button asChild size="sm" className="gap-1.5 rounded-full">
      <Link to="/manage/challenge/new">
        <Plus className="h-4 w-4" />
        {t({ id: 'common.createChallenge', defaultMessage: 'Create Challenge' })}
      </Link>
    </Button>
  )

  const buildChallengeActions = (challenge: ChallengeListing, isPinned: boolean) => {
    const canStart = isStartableChallengeStatus(challenge.status)
    return (
      <div className="flex items-center gap-1">
        {challenge.id != null && (
          <PauseButton paused={challenge.paused ?? false} onClick={() => togglePaused(challenge)} />
        )}
        {challenge.id != null && (
          <ArchiveButton
            archived={challenge.isArchived ?? false}
            onClick={() => archiveChallenge(challenge)}
          />
        )}
        {challenge.id != null && (
          <PinButton
            pinned={isPinned}
            entity="challenge"
            onClick={() => toggleChallengePin(challenge.id)}
          />
        )}
        {challenge.id != null && (
          <DiscoverableButton
            enabled={challenge.enabled ?? false}
            onClick={() => toggleChallengeEnabled(challenge)}
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">
                {t({ id: 'common.openMenu', defaultMessage: 'Open menu' })}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canStart && (
              <DropdownMenuItem asChild>
                <Link
                  to="/challenge/$challengeId"
                  params={{ challengeId: String(challenge.id) }}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {t({ id: 'common.startChallenge', defaultMessage: 'Start challenge' })}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link
                to="/manage/challenge/$challengeId/edit"
                params={{ challengeId: String(challenge.id) }}
                className="flex cursor-pointer items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                {t({ id: 'common.editChallenge', defaultMessage: 'Edit challenge' })}
              </Link>
            </DropdownMenuItem>
            {challenge.id != null && (
              <DropdownMenuItem
                onClick={() => archiveChallenge(challenge)}
                className="flex cursor-pointer items-center gap-2"
              >
                <Archive className="h-4 w-4" />
                {challenge.isArchived
                  ? t({ id: 'common.unarchiveChallenge', defaultMessage: 'Unarchive challenge' })
                  : t({ id: 'common.archiveChallenge', defaultMessage: 'Archive challenge' })}
              </DropdownMenuItem>
            )}
            {challenge.id != null && (
              <DropdownMenuItem
                onClick={() => setRebuildChallengeId(challenge.id)}
                className="flex cursor-pointer items-center gap-2"
              >
                <Hammer className="h-4 w-4" />
                {t({ id: 'common.rebuildTasks', defaultMessage: 'Rebuild tasks' })}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                const url = `${window.location.origin}/challenge/${challenge.id}`
                void navigator.clipboard.writeText(url)
              }}
              className="flex cursor-pointer items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {t({ id: 'common.copyUrl', defaultMessage: 'Copy URL' })}
            </DropdownMenuItem>
            {challenge.id != null && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteChallengeId(challenge.id)}
                  className="flex cursor-pointer items-center gap-2 text-danger focus:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                  {t({ id: 'common.deleteChallenge', defaultMessage: 'Delete challenge' })}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div
        className={cn(
          'grid h-full grid-cols-1 gap-6',
          showPanel && 'lg:grid-cols-[16rem_minmax(0,1fr)]'
        )}
      >
        {showPanel && (
          <ManageInfoPanel
            docs={[
              {
                page: 'creatingAChallenge',
                text: t({
                  id: 'manageChallenges.content.challengeCreationGuideLink',
                  defaultMessage: 'Challenge Creation Guide',
                }),
              },
              {
                page: 'taskPriorityRules',
                text: t({
                  id: 'manageChallenges.content.taskPriorityRulesLink',
                  defaultMessage: 'Task Priority Rules',
                }),
              },
              {
                page: 'bulkEditingChallenges',
                text: t({
                  id: 'manageChallenges.content.bulkEditingLink',
                  defaultMessage: 'Bulk Editing Challenges',
                }),
              },
            ]}
            onClose={() => setShowPanel(false)}
          />
        )}

        <div className="flex h-full min-h-0 min-w-0 flex-col">
          <div className="shrink-0 pb-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              {!showPanel && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setShowPanel(true)}
                  title={t({ id: 'common.showPanel', defaultMessage: 'Show panel' })}
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              )}
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t({
                  id: 'common.searchChallenges2',
                  defaultMessage: 'Search challenges...',
                })}
                className="w-full sm:max-w-xs"
              />
              <FilterToggle
                label={t({ id: 'common.discoverable', defaultMessage: 'Discoverable' })}
                icon={Eye}
                checked={onlyDiscoverable}
                onCheckedChange={setOnlyDiscoverable}
              />
              <FilterToggle
                label={t({ id: 'common.archived', defaultMessage: 'Archived' })}
                icon={Archive}
                checked={onlyArchived}
                onCheckedChange={setOnlyArchived}
              />
              <FilterToggle
                label={t({ id: 'common.owned', defaultMessage: 'Owned' })}
                icon={User}
                checked={onlyOwned}
                onCheckedChange={setOnlyOwned}
              />
              <FilterToggle
                label={t({ id: 'common.pinned', defaultMessage: 'Pinned' })}
                icon={Pin}
                checked={onlyPinned}
                onCheckedChange={setOnlyPinned}
              />
              <ClearManageFiltersButton
                hasActiveFilters={onlyDiscoverable || onlyArchived || onlyOwned || onlyPinned}
                onClear={() => {
                  setOnlyDiscoverable(false)
                  setOnlyArchived(false)
                  setOnlyOwned(false)
                  setOnlyPinned(false)
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}
            >
              {!isLoading && (
                <EntityGrid
                  items={challenges}
                  renderItem={(challenge) => {
                    const isPinned =
                      challenge.id != null && pinnedChallengeIds.includes(challenge.id)
                    return (
                      <ChallengeCard
                        challenge={challenge}
                        parentName={challenge.parentName ?? undefined}
                        linkTo="/manage/challenge/$challengeId"
                        linkParams={{ challengeId: challenge.id.toString() }}
                        actions={buildChallengeActions(challenge, isPinned)}
                      />
                    )
                  }}
                  getItemKey={(challenge) => challenge.id ?? crypto.randomUUID()}
                  emptyState={{
                    icon: ListChecks,
                    title: t({
                      id: 'common.noChallengesFound',
                      defaultMessage: 'No challenges found',
                    }),
                    actionLabel: t({
                      id: 'common.createChallenge',
                      defaultMessage: 'Create Challenge',
                    }),
                    actionTo: '/manage/challenge/new',
                  }}
                />
              )}
            </div>

            {!isLoading && challenges.length > 0 && (
              <LoadMoreFooter
                hasNextPage={hasNextPage}
                isFetching={isFetching}
                onLoadMore={loadMore}
              />
            )}
          </div>
        </div>
      </div>
      <AlertDialog
        open={deleteChallengeId != null}
        onOpenChange={(open) => !open && setDeleteChallengeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t({ id: 'common.deleteChallenge2', defaultMessage: 'Delete challenge?' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t({
                id: 'common.deleteChallengeWarning',
                defaultMessage:
                  'This will delete this challenge and all its tasks. This action cannot be undone.',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t({ id: 'common.cancel', defaultMessage: 'Cancel' })}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteChallenge} variant="destructive">
              {t({ id: 'common.delete', defaultMessage: 'Delete' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {rebuildChallengeId != null && (
        <ChallengeRebuildDialog
          challengeId={rebuildChallengeId}
          onClose={() => setRebuildChallengeId(null)}
        />
      )}
    </div>
  )
}

const ChallengeRebuildDialog = ({
  challengeId,
  onClose,
}: {
  challengeId: number
  onClose: () => void
}) => {
  const { data: challenge } = api.challenge.getChallenge(challengeId)
  if (!challenge) return null
  return (
    <RebuildTasksDialog
      open
      onOpenChange={(open) => !open && onClose()}
      challengeId={challengeId}
      sourceType={getChallengeSourceType(challenge)}
      taskBundleIdProperty={challenge.taskBundleIdProperty}
    />
  )
}
