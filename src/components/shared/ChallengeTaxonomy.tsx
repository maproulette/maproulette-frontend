import { Badge } from '@/components/ui/Badge'
import { useIntl } from '@/i18n'
import { getChallengeTaxonomy } from '@/lib/challengeTaxonomy'
import { cn } from '@/lib/utils'
import type { Challenge } from '@/types/Challenge'

interface ChallengeTaxonomyProps {
  challenge: Pick<Challenge, 'featured' | 'cooperativeType' | 'isGlobal'>
  className?: string
}

/**
 * The challenge's taxonomical categories -- featured, tag fix, cooperative,
 * global -- as a row of badges. Renders nothing for an ordinary challenge so
 * it can be dropped into a layout without leaving a gap behind.
 */
export const ChallengeTaxonomy = ({ challenge, className }: ChallengeTaxonomyProps) => {
  const { t } = useIntl()
  const entries = getChallengeTaxonomy(challenge, t)

  if (entries.length === 0) return null

  return (
    <ul className={cn('flex flex-wrap items-center gap-1', className)}>
      {entries.map((entry) => (
        <li key={entry.key}>
          <Badge variant="outline" className={cn('text-xs', entry.className)}>
            {entry.label}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
