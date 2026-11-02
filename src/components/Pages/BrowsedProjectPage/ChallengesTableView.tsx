import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import { useChallengeProgress } from '@/hooks/useChallengeProgress'
import { useIntl } from '@/i18n'
import { getDifficultyLabel } from '@/lib/difficultyLevelData'
import type { Challenge } from '@/types/Challenge'

interface ChallengesTableViewProps {
  challenges: Challenge[]
  renderActions: (challenge: Challenge) => ReactNode
}

/**
 * Browse-only list/table rendering of challenges: no edit/delete/enable/rebuild
 * affordances, just the read-only columns a visitor cares about plus whatever
 * per-row actions the caller supplies (pin, start, view, copy URL).
 */
export const ChallengesTableView = ({ challenges, renderActions }: ChallengesTableViewProps) => {
  const { t } = useIntl()
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-slate-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t({ id: 'common.name', defaultMessage: 'Name' })}</TableHead>
            <TableHead className="hidden max-w-[240px] lg:table-cell">
              {t({ id: 'common.description', defaultMessage: 'Description' })}
            </TableHead>
            <TableHead className="hidden w-28 text-center md:table-cell">
              {t({ id: 'common.difficulty', defaultMessage: 'Difficulty' })}
            </TableHead>
            <TableHead className="hidden w-24 text-center md:table-cell">
              {t({ id: 'common.tasks', defaultMessage: 'Tasks' })}
            </TableHead>
            <TableHead className="w-28 text-center">
              {t({ id: 'browsedProjectPage.challengesTable.complete', defaultMessage: 'Complete' })}
            </TableHead>
            <TableHead className="w-[100px] text-right">
              {t({ id: 'common.actions', defaultMessage: 'Actions' })}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {challenges.map((challenge) => (
            <ChallengesTableRow
              key={challenge.id ?? challenge.name}
              challenge={challenge}
              actions={renderActions(challenge)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface ChallengesTableRowProps {
  challenge: Challenge
  actions: ReactNode
}

const ChallengesTableRow = ({ challenge, actions }: ChallengesTableRowProps) => {
  const { t } = useIntl()
  const {
    completionPercentage,
    total: statsTotal,
    tasksRemaining: statsRemaining,
  } = useChallengeProgress(challenge.completionMetrics)
  const metricsRemaining = challenge.completionMetrics?.tasksRemaining
  const tasksRemaining = statsRemaining > 0 ? statsRemaining : (metricsRemaining ?? 0)
  const fallbackPercentage = challenge.completionPercentage || 0
  const pct = completionPercentage || fallbackPercentage
  const totalTasks =
    statsTotal > 0
      ? statsTotal
      : pct > 0 && pct < 100
        ? Math.round(tasksRemaining / (1 - pct / 100))
        : pct >= 100
          ? 0
          : tasksRemaining

  return (
    <TableRow>
      <TableCell>
        <Link
          to="/challenge/$challengeId"
          params={{ challengeId: String(challenge.id) }}
          className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          {challenge.name}
        </Link>
      </TableCell>
      <TableCell className="hidden max-w-[240px] truncate text-zinc-600 lg:table-cell dark:text-zinc-400">
        {challenge.blurb || challenge.description || '—'}
      </TableCell>
      <TableCell className="hidden text-center text-zinc-500 md:table-cell dark:text-zinc-400">
        {getDifficultyLabel(t, challenge.difficulty)}
      </TableCell>
      <TableCell className="hidden text-center md:table-cell">
        <span className="font-medium tabular-nums">{totalTasks}</span>
      </TableCell>
      <TableCell className="text-center">
        <span className="font-medium tabular-nums">{pct}%</span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">{actions}</div>
      </TableCell>
    </TableRow>
  )
}
