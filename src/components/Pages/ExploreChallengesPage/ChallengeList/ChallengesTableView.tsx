import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/Badge'
import { ScrollArea } from '@/components/ui/ScrollArea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import { useIntl } from '@/i18n'
import { getParentInfo } from '@/lib/challengeParent'
import { formatDate } from '@/lib/date'
import { getDifficultyColor, getDifficultyLabel } from '@/lib/difficultyLevelData'
import { cn } from '@/lib/utils'
import { useChallengeResultsContext } from '../contexts/ChallengeResultsContext'

export const ChallengesTableView = () => {
  const { t } = useIntl()
  const { challenges } = useChallengeResultsContext()
  return (
    <ScrollArea className="min-h-0 w-full flex-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('common.name', undefined, 'Name')}</TableHead>
            <TableHead>
              {t('exploreChallenges.challengeList.table.author', undefined, 'Author')}
            </TableHead>
            <TableHead>
              {t('exploreChallenges.challengeList.table.organisation', undefined, 'Organisation')}
            </TableHead>
            <TableHead className="text-center">
              {t(
                'exploreChallenges.challengeList.table.percentMapped',
                undefined,
                'Percent mapped'
              )}
            </TableHead>
            <TableHead className="text-center">
              {t(
                'exploreChallenges.challengeList.table.percentValidated',
                undefined,
                'Percent validated'
              )}
            </TableHead>
            <TableHead className="text-center">
              {t('exploreChallenges.challengeList.table.contributors', undefined, 'Contributors')}
            </TableHead>
            <TableHead className="text-center">
              {t('common.priority', undefined, 'Priority')}
            </TableHead>
            <TableHead className="text-center">
              {t('common.difficulty', undefined, 'Difficulty')}
            </TableHead>
            <TableHead className="text-center">{t('common.status', undefined, 'Status')}</TableHead>
            <TableHead>
              {t('exploreChallenges.challengeList.table.location', undefined, 'Location')}
            </TableHead>
            <TableHead>
              {t('exploreChallenges.challengeList.table.lastUpdated', undefined, 'Last updated')}
            </TableHead>
            <TableHead>
              {t('exploreChallenges.challengeList.table.dueDate', undefined, 'Due date')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {challenges.map((challenge) => {
            const { name: parentName } = getParentInfo(challenge.parent)
            return (
              <TableRow key={challenge.id}>
                <TableCell>
                  <Link
                    to="/challenge/$challengeId"
                    params={{ challengeId: challenge.id.toString() }}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {challenge.name}
                  </Link>
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-slate-400">
                  {challenge.owner
                    ? t(
                        'exploreChallenges.challengeList.table.userLabel',
                        { owner: challenge.owner },
                        'User {owner}'
                      )
                    : '--'}
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-slate-400">
                  {challenge.parent
                    ? t(
                        'exploreChallenges.challengeList.table.projectLabel',
                        { name: parentName },
                        'Project {name}'
                      )
                    : '--'}
                </TableCell>
                <TableCell className="text-center text-zinc-600 dark:text-slate-400">
                  {challenge.completionPercentage ?? 0}%
                </TableCell>
                <TableCell className="text-center text-zinc-600 dark:text-slate-400">--</TableCell>
                <TableCell className="text-center text-zinc-600 dark:text-slate-400">--</TableCell>
                <TableCell className="text-center">
                  {challenge.featured ? (
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-800 text-xs dark:bg-orange-900 dark:text-orange-200"
                    >
                      {t('exploreChallenges.challengeList.table.urgent', undefined, 'URGENT')}
                    </Badge>
                  ) : (
                    <span className="text-zinc-600 dark:text-slate-400">--</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={cn(getDifficultyColor(challenge.difficulty), 'text-xs')}
                  >
                    {getDifficultyLabel(t, challenge.difficulty)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-xs">
                    {challenge.enabled
                      ? t('exploreChallenges.challengeList.table.published', undefined, 'Published')
                      : t('exploreChallenges.challengeList.table.disabled', undefined, 'Disabled')}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-slate-400">
                  {typeof challenge.location === 'string' ? challenge.location : '--'}
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-slate-400">
                  {challenge.modified ? formatDate(new Date(challenge.modified)) : '--'}
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-slate-400">--</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
