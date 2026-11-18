import { Link } from '@tanstack/react-router'
import { ChallengeTaxonomy } from '@/components/shared/ChallengeTaxonomy'
import { Badge } from '@/components/ui/Badge'
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
import { getChallengeTaxonomy } from '@/lib/challengeTaxonomy'
import { formatDate } from '@/lib/date'
import { getDifficultyBadgeColor, getDifficultyLabel } from '@/lib/difficultyLevelData'
import { cn } from '@/lib/utils'
import { useChallengeResultsContext } from '../contexts/ChallengeResultsContext'
import { ListFooter } from './ListFooter'

export const ChallengesTableView = () => {
  const { t, locale } = useIntl()
  const { challenges } = useChallengeResultsContext()
  return (
    <div className="min-h-0 w-full flex-1 overflow-auto">
      <div className="w-fit min-w-full overflow-clip rounded-lg border border-line bg-panel">
        <Table scroll={false}>
          <TableHeader className="[&_th]:shadow-[inset_0_-1px_0_var(--line)] [&_tr]:border-b-0">
            <TableRow>
              <TableHead>{t({ id: 'common.name', defaultMessage: 'Name' })}</TableHead>
              <TableHead>{t({ id: 'common.project', defaultMessage: 'Project' })}</TableHead>
              <TableHead className="text-center">
                {t({
                  id: 'exploreChallenges.challengeList.table.percentMapped',
                  defaultMessage: 'Percent mapped',
                })}
              </TableHead>
              <TableHead className="text-center">
                {t({ id: 'common.type', defaultMessage: 'Type' })}
              </TableHead>
              <TableHead className="text-center">
                {t({ id: 'common.difficulty', defaultMessage: 'Difficulty' })}
              </TableHead>
              <TableHead>
                {t({
                  id: 'exploreChallenges.challengeList.table.lastUpdated',
                  defaultMessage: 'Last updated',
                })}
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
                      className="font-medium text-link hover:underline"
                    >
                      {challenge.name}
                    </Link>
                  </TableCell>
                  <TableCell>{challenge.parent ? parentName : '--'}</TableCell>
                  <TableCell className="text-center">
                    {challenge.completionPercentage ?? 0}%
                  </TableCell>
                  <TableCell className="text-center">
                    {taxonomy.length > 0 ? (
                      <ChallengeTaxonomy challenge={challenge} className="justify-center" />
                    ) : (
                      <span className="text-fg-muted">--</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={cn(getDifficultyBadgeColor(challenge.difficulty), 'text-xs')}
                    >
                      {getDifficultyLabel(t, challenge.difficulty)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {challenge.modified ? formatDate(new Date(challenge.modified), locale) : '--'}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <div className="sticky left-0 w-full">
        <ListFooter />
      </div>
    </div>
  )
}
