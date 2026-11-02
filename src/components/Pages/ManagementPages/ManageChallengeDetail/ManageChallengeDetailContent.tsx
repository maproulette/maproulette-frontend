import { Link, useParams } from '@tanstack/react-router'
import {
  BarChart3,
  Calendar,
  Clock,
  Eye,
  FileText,
  Hammer,
  History,
  Info,
  Pencil,
  Target,
  Users,
} from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { api } from '@/api'
import { ChallengeStatusIndicator } from '@/components/Pages/ManagementPages/ManageChallengeDetail/ChallengeStatusIndicator'
import {
  getChallengeSourceType,
  RebuildTasksDialog,
} from '@/components/Pages/ManagementPages/shared/RebuildTasksDialog'
import { VisibilityToggle } from '@/components/Pages/ManagementPages/shared/VisibilityToggle'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DrawerPortalTarget } from '@/components/TaskInfoPanel/DrawerPortalContext'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog'
import { Progress } from '@/components/ui/Progress'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable'
import { Separator } from '@/components/ui/Separator'
import { useAuthContext } from '@/contexts/AuthContext'
import { useSetBreadcrumbs, useSetPageTitle } from '@/contexts/ChromeContext'
import { useIntl } from '@/i18n'
import { formatDate } from '@/lib/date'
import { getDifficultyColor, getDifficultyLabel } from '@/lib/difficultyLevelData'
import { isSuperUser } from '@/lib/SuperAdminGuard'
import { cn } from '@/lib/utils'
import type { ChallengeGetResponse } from '@/types/Challenge'
import { ChallengeManagersPanel } from './ChallengeManagersPanel'
import { ChallengeRecentActivity } from './ChallengeRecentActivity'
import { ChallengeTasksExplorerMain } from './ChallengeTasksExplorer'

type DialogActionButtonProps = {
  icon: ReactNode
  label: string
  title: string
  children: ReactNode
}

const DialogActionButton = ({ icon, label, title, children }: DialogActionButtonProps) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" className="w-full justify-start gap-2 rounded-full">
        {icon}
        {label}
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      {children}
    </DialogContent>
  </Dialog>
)

const StatisticsDialogContent = ({
  challengeId,
  challengeData,
}: {
  challengeId: number
  challengeData: ChallengeGetResponse | undefined
}) => {
  const { t, locale } = useIntl()
  const { data: statsData, isLoading } = api.challenge.getChallengeStats(challengeId)
  const challengeStats = statsData?.[0]
  const stats = challengeStats?.actions
  const tasksRemaining = challengeData?.completionMetrics?.tasksRemaining ?? stats?.available ?? 0
  const totalTasks = stats?.total ?? 0
  const completedTasks = totalTasks > 0 ? totalTasks - tasksRemaining : 0
  const completionPercentage =
    challengeData?.completionPercentage ??
    (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0)

  const statusCounts: Array<{ id: string; label: string; value: number | undefined }> = [
    {
      id: 'common.available',
      label: t({
        id: 'common.available',
        defaultMessage: 'Available',
      }),
      value: stats?.available,
    },
    {
      id: 'common.fixed',
      label: t({ id: 'common.fixed', defaultMessage: 'Fixed' }),
      value: stats?.fixed,
    },
    {
      id: 'common.falsePositive',
      label: t({
        id: 'common.falsePositive',
        defaultMessage: 'False Positive',
      }),
      value: stats?.falsePositive,
    },
    {
      id: 'common.skipped',
      label: t({
        id: 'common.skipped',
        defaultMessage: 'Skipped',
      }),
      value: stats?.skipped,
    },
    {
      id: 'common.alreadyFixed',
      label: t({
        id: 'common.alreadyFixed',
        defaultMessage: 'Already Fixed',
      }),
      value: stats?.alreadyFixed,
    },
    {
      id: 'common.cantComplete',
      label: t({
        id: 'common.cantComplete',
        defaultMessage: "Can't Complete",
      }),
      value: stats?.tooHard,
    },
    {
      id: 'common.disabled',
      label: t({
        id: 'common.disabled',
        defaultMessage: 'Disabled',
      }),
      value: stats?.disabled,
    },
  ]

  if (isLoading) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {t({ id: 'common.loading', defaultMessage: 'Loading…' })}
      </p>
    )
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-zinc-600 dark:text-zinc-400">
          {t({ id: 'common.tasksRemaining', defaultMessage: 'Tasks remaining' })}
        </span>
        <span className="font-semibold">
          {tasksRemaining}
          {totalTasks > 0 ? (
            <span className="font-normal text-zinc-500 dark:text-zinc-400"> / {totalTasks}</span>
          ) : null}
        </span>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-zinc-600 dark:text-zinc-400">
            {t({
              id: 'manageChallengeDetail.detail.statistics.completion',
              defaultMessage: 'Completion',
            })}
          </span>
          <span className="font-semibold">{Math.round(completionPercentage)}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Calendar className="h-4 w-4 opacity-70" />
          {t({ id: 'common.created', defaultMessage: 'Created' })}
        </span>
        <span className="font-medium">
          {challengeData?.created ? formatDate(new Date(challengeData.created), locale) : '—'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Clock className="h-4 w-4 opacity-70" />
          {t({
            id: 'manageChallengeDetail.detail.statistics.lastModified',
            defaultMessage: 'Last modified',
          })}
        </span>
        <span className="font-medium">
          {challengeData?.modified ? formatDate(new Date(challengeData.modified), locale) : '—'}
        </span>
      </div>

      {stats && (
        <>
          <Separator />
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">
              {t({
                id: 'manageChallengeDetail.detail.statistics.taskCountsByStatus',
                defaultMessage: 'Task counts by status',
              })}
            </h3>
            {statusCounts.map(({ id, label, value }) => (
              <div key={id} className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
                <span className="font-semibold">{value || 0}</span>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {t({ id: 'common.total', defaultMessage: 'Total' })}
              </span>
              <span className="font-bold text-base">{stats.total || 0}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export const ManageChallengeDetailContent = () => {
  const { t } = useIntl()
  const { challengeId } = useParams({ from: '/_app/manage/challenge/$challengeId/' })

  const { data: challengeData, isLoading: isLoadingChallenge } = api.challenge.getChallenge(
    Number(challengeId)
  )
  const [rebuildOpen, setRebuildOpen] = useState(false)
  const { user } = useAuthContext()
  const canSetFeatured = isSuperUser(user)
  const updateChallengeMutation = api.challenge.useUpdateChallenge()
  const toggleField = (field: 'enabled' | 'paused' | 'featured') => (id: number, value: boolean) =>
    updateChallengeMutation.mutateAsync({ challengeId: id, updates: { [field]: value } })

  useSetPageTitle(challengeData?.name ?? null)

  const projectId = challengeData?.parent
  const breadcrumbs = useMemo(
    () =>
      projectId != null
        ? [
            {
              label: t({ id: 'common.createManage', defaultMessage: 'create & manage' }),
              href: '/manage',
            },
            {
              label: t({ id: 'common.projects2', defaultMessage: 'projects' }),
              href: '/manage/projects',
            },
            { label: String(projectId), href: `/manage/project/${projectId}` },
            {
              label: t({ id: 'common.challenges2', defaultMessage: 'challenges' }),
              href: '/manage/challenges',
            },
            { label: challengeId, href: `/manage/challenge/${challengeId}` },
          ]
        : null,
    [projectId, challengeId, t]
  )
  useSetBreadcrumbs(breadcrumbs)

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
        <aside className="h-full min-h-0 overflow-hidden pr-4">
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200/40 bg-white shadow-sm dark:border-slate-700/40 dark:bg-slate-800">
            {/* Header */}
            <div className="space-y-2.5 px-6 pt-6 pb-4">
              {!isLoadingChallenge && challengeData?.featured && (
                <ul className="flex flex-wrap items-center gap-2.5">
                  <li>
                    <span className="font-medium text-cyan-500 text-xs uppercase tracking-wide dark:text-cyan-400">
                      {t({ id: 'common.featured', defaultMessage: 'Featured' })}
                    </span>
                  </li>
                </ul>
              )}

              <h1 className="line-clamp-2 font-bold text-base text-zinc-900 leading-tight tracking-tight dark:text-zinc-50">
                {challengeData?.name}
              </h1>

              {!isLoadingChallenge && (
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0 font-medium text-xs text-zinc-600 dark:text-zinc-400">
                  <StatusBadge enabled={challengeData?.enabled || false} />
                  <span className="text-zinc-400 dark:text-zinc-500">•</span>
                  <span className="whitespace-nowrap">
                    {t({ id: 'common.idNumber', defaultMessage: 'ID {id}' }, { id: challengeId })}
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-500">•</span>
                  <span
                    className={cn(
                      'font-medium',
                      getDifficultyColor(challengeData?.difficulty as number)
                    )}
                  >
                    {getDifficultyLabel(t, challengeData?.difficulty as number)}
                  </span>
                </div>
              )}

              {!isLoadingChallenge && challengeData?.id != null && (
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <VisibilityToggle
                    id={challengeData.id}
                    enabled={challengeData.enabled}
                    onToggle={toggleField('enabled')}
                    label={t({ id: 'common.enabled', defaultMessage: 'Enabled' })}
                    errorMessage={t({
                      id: 'common.couldNotUpdateVisibility',
                      defaultMessage: 'Could not update visibility',
                    })}
                  />
                  <VisibilityToggle
                    id={challengeData.id}
                    enabled={challengeData.paused}
                    onToggle={toggleField('paused')}
                    label={t({ id: 'common.paused', defaultMessage: 'Paused' })}
                    errorMessage={t({
                      id: 'manageChallengeDetail.detail.pausedError',
                      defaultMessage: 'Could not update paused state',
                    })}
                  />
                  {canSetFeatured && (
                    <VisibilityToggle
                      id={challengeData.id}
                      enabled={challengeData.featured}
                      onToggle={toggleField('featured')}
                      label={t({ id: 'common.featured', defaultMessage: 'Featured' })}
                      errorMessage={t({
                        id: 'manageChallengeDetail.detail.featuredError',
                        defaultMessage: 'Could not update featured state',
                      })}
                    />
                  )}
                </div>
              )}
            </div>

            {challengeData?.blurb && (
              <div className="px-6 py-4">
                <p className="text-pretty text-sm text-zinc-700 leading-relaxed dark:text-zinc-300">
                  {challengeData.blurb}
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto border-zinc-200/50 border-t dark:border-slate-700/50">
              <div className="flex flex-col gap-2 px-6 py-4">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-full"
                >
                  <Link to="/challenge/$challengeId" params={{ challengeId }}>
                    <Eye className="h-4 w-4" />
                    {t({ id: 'common.browseChallenge', defaultMessage: 'Browse challenge' })}
                  </Link>
                </Button>
                <Button asChild size="sm" className="w-full justify-start gap-2 rounded-full">
                  <Link to="/manage/challenge/$challengeId/edit" params={{ challengeId }}>
                    <Pencil className="h-4 w-4" />
                    {t({ id: 'common.editChallenge', defaultMessage: 'Edit challenge' })}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-full"
                >
                  <Link to="/manage/challenge/$challengeId/prioritization" params={{ challengeId }}>
                    <Target className="h-4 w-4" />
                    {t({
                      id: 'manageChallengeDetail.detail.configurePrioritization',
                      defaultMessage: 'Configure prioritization',
                    })}
                  </Link>
                </Button>

                {!isLoadingChallenge && challengeData?.id != null && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 rounded-full"
                    onClick={() => setRebuildOpen(true)}
                  >
                    <Hammer className="h-4 w-4" />
                    {t({ id: 'common.rebuildTasks', defaultMessage: 'Rebuild tasks' })}
                  </Button>
                )}

                <DialogActionButton
                  icon={<BarChart3 className="h-4 w-4" />}
                  label={t({
                    id: 'manageChallengeDetail.detail.statisticsLabel',
                    defaultMessage: 'Statistics',
                  })}
                  title={t({
                    id: 'manageChallengeDetail.detail.statisticsLabel',
                    defaultMessage: 'Statistics',
                  })}
                >
                  <StatisticsDialogContent
                    challengeId={Number(challengeId)}
                    challengeData={challengeData}
                  />
                </DialogActionButton>

                {!isLoadingChallenge && challengeData?.id && (
                  <DialogActionButton
                    icon={<Users className="h-4 w-4" />}
                    label={t({
                      id: 'manageChallengeDetail.detail.managersLabel',
                      defaultMessage: 'Managers',
                    })}
                    title={t({
                      id: 'manageChallengeDetail.detail.managersLabel',
                      defaultMessage: 'Managers',
                    })}
                  >
                    <ChallengeManagersPanel challengeId={challengeData.id} />
                  </DialogActionButton>
                )}

                {!isLoadingChallenge && challengeData?.id && (
                  <DialogActionButton
                    icon={<History className="h-4 w-4" />}
                    label={t({ id: 'common.recentActivity', defaultMessage: 'Recent Activity' })}
                    title={t({ id: 'common.recentActivity', defaultMessage: 'Recent Activity' })}
                  >
                    <ChallengeRecentActivity challengeId={challengeData.id} />
                  </DialogActionButton>
                )}

                {!isLoadingChallenge &&
                  challengeData?.description &&
                  challengeData.description !== challengeData.blurb && (
                    <DialogActionButton
                      icon={<Info className="h-4 w-4" />}
                      label={t({ id: 'common.description', defaultMessage: 'Description' })}
                      title={t({ id: 'common.description', defaultMessage: 'Description' })}
                    >
                      <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                        {challengeData.description}
                      </p>
                    </DialogActionButton>
                  )}

                {!isLoadingChallenge && challengeData?.instruction && (
                  <DialogActionButton
                    icon={<FileText className="h-4 w-4" />}
                    label={t({ id: 'common.instructions', defaultMessage: 'Instructions' })}
                    title={t({ id: 'common.instructions', defaultMessage: 'Instructions' })}
                  >
                    <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                      {challengeData.instruction}
                    </p>
                  </DialogActionButton>
                )}

                {!isLoadingChallenge && challengeData?.id && (
                  <div className="pt-2">
                    <ChallengeStatusIndicator
                      challenge={challengeData}
                      challengeId={challengeData.id}
                    />
                  </div>
                )}
              </div>
            </div>
            {challengeData?.id != null && (
              <RebuildTasksDialog
                open={rebuildOpen}
                onOpenChange={setRebuildOpen}
                challengeId={challengeData.id}
                sourceType={getChallengeSourceType(challengeData)}
                taskBundleIdProperty={challengeData.taskBundleIdProperty}
              />
            )}
            <DrawerPortalTarget />
          </div>
        </aside>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={70} minSize={40} style={{ overflow: 'visible' }}>
        <div className="flex h-full min-h-0 min-w-0 flex-col" style={{ overflow: 'visible' }}>
          <ChallengeTasksExplorerMain />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
