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
import { useSetBreadcrumbContext } from '@/contexts/BreadcrumbContext'
import { useSetPageTitleContext } from '@/contexts/PageTitleContext'
import { useIntl } from '@/i18n'
import { formatDate } from '@/lib/date'
import { getDifficultyColor, getDifficultyLabel } from '@/lib/difficultyLevelData'
import { isSuperUser } from '@/lib/SuperAdminGuard'
import { cn } from '@/lib/utils'
import type { ChallengeGetResponse } from '@/types/Challenge'
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
  const { t } = useIntl()
  const { data: statsData, isLoading } = api.challenge.getChallengeStats(challengeId)
  const challengeStats = statsData?.[0]
  const stats = challengeStats?.actions
  const tasksRemaining = stats?.available ?? challengeData?.completionMetrics?.tasksRemaining ?? 0
  const totalTasks = stats?.total ?? 0
  const completedTasks = totalTasks > 0 ? totalTasks - tasksRemaining : 0
  const completionPercentage =
    challengeData?.completionPercentage ??
    (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0)

  const statusCounts: Array<{ id: string; defaultLabel: string; value: number | undefined }> = [
    {
      id: 'manageChallengeDetail.detail.statistics.available',
      defaultLabel: 'Available',
      value: stats?.available,
    },
    {
      id: 'manageChallengeDetail.detail.statistics.fixed',
      defaultLabel: 'Fixed',
      value: stats?.fixed,
    },
    {
      id: 'manageChallengeDetail.detail.statistics.falsePositive',
      defaultLabel: 'False Positive',
      value: stats?.falsePositive,
    },
    {
      id: 'manageChallengeDetail.detail.statistics.skipped',
      defaultLabel: 'Skipped',
      value: stats?.skipped,
    },
    {
      id: 'manageChallengeDetail.detail.statistics.alreadyFixed',
      defaultLabel: 'Already Fixed',
      value: stats?.alreadyFixed,
    },
    {
      id: 'manageChallengeDetail.detail.statistics.tooHard',
      defaultLabel: "Can't Complete",
      value: stats?.tooHard,
    },
    {
      id: 'manageChallengeDetail.detail.statistics.disabled',
      defaultLabel: 'Disabled',
      value: stats?.disabled,
    },
  ]

  if (isLoading) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {t('common.loading', undefined, 'Loading…')}
      </p>
    )
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-zinc-600 dark:text-zinc-400">
          {t('common.tasksRemaining', undefined, 'Tasks remaining')}
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
            {t('manageChallengeDetail.detail.statistics.completion', undefined, 'Completion')}
          </span>
          <span className="font-semibold">{Math.round(completionPercentage)}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Calendar className="h-4 w-4 opacity-70" />
          {t('common.created', undefined, 'Created')}
        </span>
        <span className="font-medium">
          {challengeData?.created ? formatDate(new Date(challengeData.created)) : '—'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Clock className="h-4 w-4 opacity-70" />
          {t('manageChallengeDetail.detail.statistics.lastModified', undefined, 'Last modified')}
        </span>
        <span className="font-medium">
          {challengeData?.modified ? formatDate(new Date(challengeData.modified)) : '—'}
        </span>
      </div>

      {stats && (
        <>
          <Separator />
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">
              {t(
                'manageChallengeDetail.detail.statistics.taskCountsByStatus',
                undefined,
                'Task counts by status'
              )}
            </h3>
            {statusCounts.map(({ id, defaultLabel, value }) => (
              <div key={id} className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {t(id, undefined, defaultLabel)}
                </span>
                <span className="font-semibold">{value || 0}</span>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t('common.total', undefined, 'Total')}</span>
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

  useSetPageTitleContext(challengeData?.name ?? null)

  const projectId = challengeData?.parent
  const breadcrumbs = useMemo(
    () =>
      projectId != null
        ? [
            {
              label: t('common.createManage', undefined, 'create & manage'),
              href: '/manage',
            },
            {
              label: t('common.projects2', undefined, 'projects'),
              href: '/manage/projects',
            },
            { label: String(projectId), href: `/manage/project/${projectId}` },
            {
              label: t('common.challenges2', undefined, 'challenges'),
              href: '/manage/challenges',
            },
            { label: challengeId, href: `/manage/challenge/${challengeId}` },
          ]
        : null,
    [projectId, challengeId, t]
  )
  useSetBreadcrumbContext(breadcrumbs)

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
                      {t('common.featured', undefined, 'Featured')}
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
                    {t('common.idNumber', { id: challengeId }, 'ID {id}')}
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
                    label={t('common.enabled', undefined, 'Enabled')}
                    errorMessage={t(
                      'common.couldNotUpdateVisibility',
                      undefined,
                      'Could not update visibility'
                    )}
                  />
                  <VisibilityToggle
                    id={challengeData.id}
                    enabled={challengeData.paused}
                    onToggle={toggleField('paused')}
                    label={t('common.paused', undefined, 'Paused')}
                    errorMessage={t(
                      'manageChallengeDetail.detail.pausedError',
                      undefined,
                      'Could not update paused state'
                    )}
                  />
                  {canSetFeatured && (
                    <VisibilityToggle
                      id={challengeData.id}
                      enabled={challengeData.featured}
                      onToggle={toggleField('featured')}
                      label={t('common.featured', undefined, 'Featured')}
                      errorMessage={t(
                        'manageChallengeDetail.detail.featuredError',
                        undefined,
                        'Could not update featured state'
                      )}
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
                <Link to="/challenge/$challengeId" params={{ challengeId }} className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 rounded-full"
                  >
                    <Eye className="h-4 w-4" />
                    {t('common.browseChallenge', undefined, 'Browse challenge')}
                  </Button>
                </Link>
                <Link
                  to="/manage/challenge/$challengeId/edit"
                  params={{ challengeId }}
                  className="block"
                >
                  <Button size="sm" className="w-full justify-start gap-2 rounded-full">
                    <Pencil className="h-4 w-4" />
                    {t('common.editChallenge', undefined, 'Edit challenge')}
                  </Button>
                </Link>
                <Link
                  to="/manage/challenge/$challengeId/prioritization"
                  params={{ challengeId }}
                  className="block"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 rounded-full"
                  >
                    <Target className="h-4 w-4" />
                    {t(
                      'manageChallengeDetail.detail.configurePrioritization',
                      undefined,
                      'Configure prioritization'
                    )}
                  </Button>
                </Link>

                {!isLoadingChallenge && challengeData?.id != null && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 rounded-full"
                    onClick={() => setRebuildOpen(true)}
                  >
                    <Hammer className="h-4 w-4" />
                    {t('common.rebuildTasks', undefined, 'Rebuild tasks')}
                  </Button>
                )}

                <DialogActionButton
                  icon={<BarChart3 className="h-4 w-4" />}
                  label={t('manageChallengeDetail.detail.statisticsLabel', undefined, 'Statistics')}
                  title={t('manageChallengeDetail.detail.statisticsLabel', undefined, 'Statistics')}
                >
                  <StatisticsDialogContent
                    challengeId={Number(challengeId)}
                    challengeData={challengeData}
                  />
                </DialogActionButton>

                {!isLoadingChallenge && challengeData?.id && (
                  <DialogActionButton
                    icon={<History className="h-4 w-4" />}
                    label={t('common.recentActivity', undefined, 'Recent Activity')}
                    title={t('common.recentActivity', undefined, 'Recent Activity')}
                  >
                    <ChallengeRecentActivity challengeId={challengeData.id} />
                  </DialogActionButton>
                )}

                {!isLoadingChallenge &&
                  challengeData?.description &&
                  challengeData.description !== challengeData.blurb && (
                    <DialogActionButton
                      icon={<Info className="h-4 w-4" />}
                      label={t('common.description', undefined, 'Description')}
                      title={t('common.description', undefined, 'Description')}
                    >
                      <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                        {challengeData.description}
                      </p>
                    </DialogActionButton>
                  )}

                {!isLoadingChallenge && challengeData?.instruction && (
                  <DialogActionButton
                    icon={<FileText className="h-4 w-4" />}
                    label={t('common.instructions', undefined, 'Instructions')}
                    title={t('common.instructions', undefined, 'Instructions')}
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
