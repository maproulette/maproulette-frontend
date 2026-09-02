import { Link } from '@tanstack/react-router'
import {
  Archive,
  BookOpen,
  Copy,
  Eye,
  EyeOff,
  FolderKanban,
  Hammer,
  ListChecks,
  ListOrdered,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Pencil,
  PencilLine,
  Pin,
  Play,
  Plus,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { ChallengeCard } from '@/components/shared/ChallengeCard'
import { ClearManageFiltersButton } from '@/components/shared/ClearManageFiltersButton'
import { DocsLink } from '@/components/shared/DocsLink'
import { EntityGrid } from '@/components/shared/EntityGrid'
import { FilterToggle } from '@/components/shared/FilterToggle'
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
import { useSetHeaderActionsContext } from '@/contexts/HeaderActionsContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import type { Challenge } from '@/types/Challenge'
import { useManageChallengesContext } from './ManageChallengesContext'

export const ManageChallengesContent = () => {
  const { t } = useIntl()
  const {
    filteredChallenges,
    isLoading,
    pinnedChallengeIds,
    searchQuery,
    setSearchQuery,
    onlyDiscoverable,
    setOnlyDiscoverable,
    onlyArchived,
    setOnlyArchived,
    onlyPinned,
    setOnlyPinned,
    deleteChallengeId,
    setDeleteChallengeId,
    confirmDeleteChallenge,
    toggleChallengePin,
    toggleChallengeEnabled,
    togglePaused,
    archiveChallenge,
    rebuildChallenge,
  } = useManageChallengesContext()

  const [showPanel, setShowPanel] = useState(true)

  useSetHeaderActionsContext(
    <Link to="/manage/challenge/new">
      <Button size="sm" className="gap-1.5 rounded-full">
        <Plus className="h-4 w-4" />
        {t('common.createChallenge', undefined, 'Create Challenge')}
      </Button>
    </Link>
  )

  const buildChallengeActions = (challenge: Challenge, isPinned: boolean) => {
    const canStart = (challenge.completionMetrics?.tasksRemaining ?? 0) > 0
    return (
      <div className="flex items-center gap-1">
        {challenge.id != null && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault()
              togglePaused(challenge)
            }}
            title={
              challenge.paused
                ? t('common.resumeChallenge', undefined, 'Resume challenge')
                : t('common.pauseChallenge', undefined, 'Pause challenge')
            }
            aria-label={
              challenge.paused
                ? t('common.resumeChallenge', undefined, 'Resume challenge')
                : t('common.pauseChallenge', undefined, 'Pause challenge')
            }
          >
            <Pause
              className={cn(
                'h-4 w-4',
                challenge.paused
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400'
              )}
            />
          </Button>
        )}
        {challenge.id != null && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault()
              archiveChallenge(challenge)
            }}
            title={
              challenge.isArchived
                ? t('common.unarchiveChallenge', undefined, 'Unarchive challenge')
                : t('common.archiveChallenge', undefined, 'Archive challenge')
            }
            aria-label={
              challenge.isArchived
                ? t('common.unarchiveChallenge', undefined, 'Unarchive challenge')
                : t('common.archiveChallenge', undefined, 'Archive challenge')
            }
          >
            <Archive
              className={cn(
                'h-4 w-4',
                challenge.isArchived
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400'
              )}
            />
          </Button>
        )}
        {challenge.id != null && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault()
              toggleChallengePin(challenge.id)
            }}
            title={
              isPinned
                ? t('common.unpinChallenge', undefined, 'Unpin challenge')
                : t('common.pinChallenge', undefined, 'Pin challenge')
            }
            aria-label={
              isPinned
                ? t('common.unpinChallenge', undefined, 'Unpin challenge')
                : t('common.pinChallenge', undefined, 'Pin challenge')
            }
          >
            <Pin
              className={cn(
                'h-4 w-4',
                isPinned
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400'
              )}
            />
          </Button>
        )}
        {challenge.id != null && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault()
              toggleChallengeEnabled(challenge)
            }}
            title={
              challenge.enabled
                ? t('common.makeNotDiscoverable', undefined, 'Make not discoverable')
                : t('common.makeDiscoverable', undefined, 'Make discoverable')
            }
            aria-label={
              challenge.enabled
                ? t('common.makeNotDiscoverable', undefined, 'Make not discoverable')
                : t('common.makeDiscoverable', undefined, 'Make discoverable')
            }
          >
            {challenge.enabled ? (
              <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <EyeOff className="h-4 w-4 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400" />
            )}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t('common.openMenu', undefined, 'Open menu')}</span>
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
                  {t('common.startChallenge', undefined, 'Start challenge')}
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
                {t('common.editChallenge', undefined, 'Edit challenge')}
              </Link>
            </DropdownMenuItem>
            {challenge.id != null && (
              <DropdownMenuItem
                onClick={() => archiveChallenge(challenge)}
                className="flex cursor-pointer items-center gap-2"
              >
                <Archive className="h-4 w-4" />
                {challenge.isArchived
                  ? t('common.unarchiveChallenge', undefined, 'Unarchive challenge')
                  : t('common.archiveChallenge', undefined, 'Archive challenge')}
              </DropdownMenuItem>
            )}
            {challenge.id != null && (
              <DropdownMenuItem
                onClick={() => rebuildChallenge(challenge.id)}
                className="flex cursor-pointer items-center gap-2"
              >
                <Hammer className="h-4 w-4" />
                {t('common.rebuildTasks', undefined, 'Rebuild tasks')}
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
              {t('common.copyUrl', undefined, 'Copy URL')}
            </DropdownMenuItem>
            {challenge.id != null && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteChallengeId(challenge.id)}
                  className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('common.deleteChallenge', undefined, 'Delete challenge')}
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
      <div className={cn('grid h-full grid-cols-1 gap-6', showPanel ? 'lg:grid-cols-3' : '')}>
        {showPanel && (
          <aside className="h-full min-h-0 overflow-hidden">
            <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200/40 bg-white shadow-sm dark:border-slate-700/40 dark:bg-slate-800">
              <div className="flex items-start justify-between px-6 pt-6 pb-2">
                <div className="space-y-2.5">
                  <h2 className="font-bold text-base text-zinc-900 leading-tight tracking-tight dark:text-zinc-50">
                    {t(
                      'manageChallenges.content.aboutChallengesTitle',
                      undefined,
                      'About Challenges'
                    )}
                  </h2>
                  <p className="text-pretty text-sm text-zinc-600 leading-relaxed dark:text-zinc-400">
                    {t(
                      'manageChallenges.content.aboutChallengesBody',
                      undefined,
                      'Challenges contain tasks that mappers work through to improve OpenStreetMap data.'
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setShowPanel(false)}
                  title={t('common.hidePanel', undefined, 'Hide panel')}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto border-zinc-200/50 border-t px-6 py-4 dark:border-slate-700/50">
                <div className="space-y-4 text-sm text-zinc-600 leading-relaxed dark:text-zinc-300">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {t(
                        'manageChallenges.content.tipWriteClearInstructionsTitle',
                        undefined,
                        'Write clear instructions'
                      )}
                    </p>
                    <p>
                      {t(
                        'manageChallenges.content.tipWriteClearInstructionsBody',
                        undefined,
                        'Good task instructions help mappers understand what to fix and how. Include examples and link to relevant wiki pages.'
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {t(
                        'manageChallenges.content.tipSetDifficultyTitle',
                        undefined,
                        'Set appropriate difficulty'
                      )}
                    </p>
                    <p>
                      {t(
                        'manageChallenges.content.tipSetDifficultyBody',
                        undefined,
                        'Match difficulty to the skill required. Easy tasks attract new mappers, while expert tasks get routed to experienced contributors.'
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {t(
                        'manageChallenges.content.tipMonitorProgressTitle',
                        undefined,
                        'Monitor progress'
                      )}
                    </p>
                    <p>
                      {t(
                        'manageChallenges.content.tipMonitorProgressBody',
                        undefined,
                        'Check completion rates and review feedback. Archive challenges once all tasks are resolved.'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-auto border-zinc-200/50 border-t bg-zinc-50/50 px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800/50">
                <p className="mb-1 font-medium text-sm text-zinc-700 dark:text-zinc-300">
                  {t('manageChallenges.content.quickLinks', undefined, 'Quick Links')}
                </p>
                <div className="space-y-2">
                  <Link
                    to="/manage/projects"
                    className="flex items-center gap-2 text-xs text-zinc-700 hover:underline dark:text-zinc-200"
                  >
                    <FolderKanban className="h-3.5 w-3.5 text-zinc-500" />
                    {t('manageChallenges.content.manageProjectsLink', undefined, 'Manage Projects')}
                  </Link>
                  <DocsLink
                    page="creatingAChallenge"
                    icon={<BookOpen className="h-3.5 w-3.5 text-zinc-500" />}
                    className="gap-2 text-xs text-zinc-700 no-underline hover:underline dark:text-zinc-200"
                  >
                    {t(
                      'manageChallenges.content.challengeCreationGuideLink',
                      undefined,
                      'Challenge Creation Guide'
                    )}
                  </DocsLink>
                  <DocsLink
                    page="taskPriorityRules"
                    icon={<ListOrdered className="h-3.5 w-3.5 text-zinc-500" />}
                    className="gap-2 text-xs text-zinc-700 no-underline hover:underline dark:text-zinc-200"
                  >
                    {t(
                      'manageChallenges.content.taskPriorityRulesLink',
                      undefined,
                      'Task Priority Rules'
                    )}
                  </DocsLink>
                  <DocsLink
                    page="bulkEditingChallenges"
                    icon={<PencilLine className="h-3.5 w-3.5 text-zinc-500" />}
                    className="gap-2 text-xs text-zinc-700 no-underline hover:underline dark:text-zinc-200"
                  >
                    {t(
                      'manageChallenges.content.bulkEditingLink',
                      undefined,
                      'Bulk Editing Challenges'
                    )}
                  </DocsLink>
                </div>
              </div>
            </div>
          </aside>
        )}

        <div
          className={cn('flex h-full min-h-0 min-w-0 flex-col', showPanel ? 'lg:col-span-2' : '')}
        >
          <div className="shrink-0 pb-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              {!showPanel && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setShowPanel(true)}
                  title={t('common.showPanel', undefined, 'Show panel')}
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              )}
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('common.searchChallenges2', undefined, 'Search challenges...')}
                className="w-full sm:max-w-xs"
              />
              <FilterToggle
                label={t('common.discoverable', undefined, 'Discoverable')}
                icon={Eye}
                checked={onlyDiscoverable}
                onCheckedChange={setOnlyDiscoverable}
              />
              <FilterToggle
                label={t('common.archived', undefined, 'Archived')}
                icon={Archive}
                checked={onlyArchived}
                onCheckedChange={setOnlyArchived}
              />
              <FilterToggle
                label={t('common.pinned', undefined, 'Pinned')}
                icon={Pin}
                checked={onlyPinned}
                onCheckedChange={setOnlyPinned}
              />
              <ClearManageFiltersButton
                hasActiveFilters={onlyDiscoverable || onlyArchived || onlyPinned}
                onClear={() => {
                  setOnlyDiscoverable(false)
                  setOnlyArchived(false)
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
                  items={filteredChallenges || []}
                  renderItem={(challenge) => {
                    const isPinned =
                      challenge.id != null && pinnedChallengeIds.includes(challenge.id)
                    return (
                      <ChallengeCard
                        challenge={challenge}
                        linkTo="/manage/challenge/$challengeId"
                        linkParams={{ challengeId: challenge.id.toString() }}
                        actions={buildChallengeActions(challenge, isPinned)}
                      />
                    )
                  }}
                  getItemKey={(challenge) => challenge.id ?? crypto.randomUUID()}
                  emptyState={{
                    icon: ListChecks,
                    title: t('common.noChallengesFound', undefined, 'No challenges found'),
                    description: t(
                      'manageChallenges.content.emptyDescription',
                      undefined,
                      "You haven't created any challenges yet"
                    ),
                    actionLabel: t('common.createChallenge', undefined, 'Create Challenge'),
                    actionTo: '/manage/challenge/new',
                  }}
                />
              )}
            </div>
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
              {t('common.deleteChallenge2', undefined, 'Delete challenge?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'common.deleteChallengeWarning',
                undefined,
                'This will delete this challenge and all its tasks. This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', undefined, 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteChallenge}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {t('common.delete', undefined, 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
