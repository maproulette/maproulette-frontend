import { Link } from '@tanstack/react-router'
import { ChallengeTaxonomy } from '@/components/shared/ChallengeTaxonomy'
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
import { isChallengeComplete } from '@/lib/challengeStatus'
import { getChallengeTaxonomy } from '@/lib/challengeTaxonomy'
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
            <TableHead>{t({ id: 'common.name', defaultMessage: 'Name' })}</TableHead>
            <TableHead>
              {t({ id: 'exploreChallenges.challengeList.table.author', defaultMessage: 'Author' })}
            </TableHead>
            <TableHead>
              {t({ id: 'exploreChallenges.challengeList.table.organisation', defaultMessage: 'Organisation' })}
            </TableHead>
            <TableHead className="text-center">
              {t({ id: 'exploreChallenges.challengeList.table.percentMapped', defaultMessage: 'Percent mapped' }
              )}
            </TableHead>
            <TableHead className="text-center">
              {t({ id: 'exploreChallenges.challengeList.table.percentValidated', defaultMessage: 'Percent validated' }
              )}
            </TableHead>
            <TableHead className="text-center">
              {t({ id: 'exploreChallenges.challengeList.table.contributors', defaultMessage: 'Contributors' })}
            </TableHead>
            <TableHead className="text-center">{t({ id: 'common.type', defaultMessage: 'Type' })}</TableHead>
            <TableHead className="text-center">
              {t({ id: 'common.difficulty', defaultMessage: 'Difficulty' })}
            </TableHead>
            <TableHead className="text-center">{t({ id: 'common.status', defaultMessage: 'Status' })}</TableHead>
            <TableHead>
              {t({ id: 'exploreChallenges.challengeList.table.location', defaultMessage: 'Location' })}
            </TableHead>
            <TableHead>
              {t({ id: 'exploreChallenges.challengeList.table.lastUpdated', defaultMessage: 'Last updated' })}
            </TableHead>
            <TableHead>
              {t({ id: 'exploreChallenges.challengeList.table.dueDate', defaultMessage: 'Due date' })}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {challenges.map((challenge) => {
            const { name: parentName } = getParentInfo(challenge.parent)
            const taxonomy = getChallengeTaxonomy(challenge, t)
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
                    ? t({ id: 'exploreChallenges.challengeList.table.userLabel', defaultMessage: 'User {owner}' }, { owner: challenge.owner }
                      )
                    : '--'}
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-slate-400">
                  {challenge.parent
                    ? t({ id: 'exploreChallenges.challengeList.table.projectLabel', defaultMessage: 'Project {name}' }, { name: parentName }
                      )
                    : '--'}
                </TableCell>
                <TableCell className="text-center text-zinc-600 dark:text-slate-400">
                  {challenge.completionPercentage ?? 0}%
                </TableCell>
                <TableCell className="text-center text-zinc-600 dark:text-slate-400">--</TableCell>
                <TableCell className="text-center text-zinc-600 dark:text-slate-400">--</TableCell>
                <TableCell className="text-center">
                  {taxonomy.length > 0 ? (
                    <ChallengeTaxonomy challenge={challenge} className="justify-center" />
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
                  <Badge
                    variant={isChallengeComplete(challenge) ? 'success' : 'outline'}
                    className="text-xs"
                  >
                    {!challenge.enabled
                      ? t({ id: 'exploreChallenges.challengeList.table.disabled', defaultMessage: 'Disabled' })
                      : isChallengeComplete(challenge)
                        ? t({ id: 'common.completed', defaultMessage: 'Completed' })
                        : t({ id: 'exploreChallenges.challengeList.table.published', defaultMessage: 'Published' }
                          )}
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
