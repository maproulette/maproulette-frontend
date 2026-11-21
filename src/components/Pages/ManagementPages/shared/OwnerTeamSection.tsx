import { Link } from '@tanstack/react-router'
import { Check, Users, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { api } from '@/api'
import { resolveTeamImageUrl } from '@/api/urls'
import { FormField, FormItem, FormMessage } from '@/components/ui/Form'
import { FormSection } from '@/components/ui/FormSection'
import { Skeleton } from '@/components/ui/Skeleton'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import type { ManagedTeam } from '@/types/Team'

interface TeamTileProps {
  label: string
  selected: boolean
  onSelect: () => void
  children: React.ReactNode
  caption?: string
}

// Tiles live in a fixed-track grid so every option lines up regardless of how
// many teams the user runs. Selection is drawn with an inset ring: the form
// body scrolls, and anything painted outside the border box gets clipped
// against the scroll container's edge.
const TILE_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(6.5rem,7rem))] gap-3'

const TeamTile = ({ label, selected, onSelect, children, caption }: TeamTileProps) => (
  <li>
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title={caption ? `${label} — ${caption}` : label}
      className={cn(
        'group relative flex w-full flex-col gap-1.5 rounded-lg border p-2 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        selected
          ? 'border-accent bg-accent/10 ring-2 ring-accent ring-inset'
          : 'border-line hover:border-line-strong hover:bg-muted'
      )}
    >
      <span className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded bg-muted">
        {children}
      </span>
      <span className="block min-w-0 leading-tight">
        <span className="block truncate text-fg-muted text-xs">{label}</span>
        {caption && <span className="block truncate text-[10px] text-fg-subtle">{caption}</span>}
      </span>
      {selected && (
        <span className="absolute top-1.5 right-1.5 rounded-full bg-accent p-0.5 text-accent-fg">
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  </li>
)

/**
 * A team's tile art: its image if it has one, and a plain icon otherwise. The
 * image url is addressed by team and 404s when the team has no approved image,
 * so a load failure means "no picture", not a broken page.
 */
const TeamArt = ({ team }: { team: ManagedTeam }) => {
  const [failed, setFailed] = useState(false)

  if (!team.challengeImageUrl || failed) {
    return <Users className="h-6 w-6 text-fg-subtle" aria-hidden="true" />
  }

  return (
    <img
      src={resolveTeamImageUrl(team.challengeImageUrl)}
      alt=""
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  )
}

/**
 * Lets the owner of a project or challenge hand it to one of their teams. The
 * team's owners, admins and managers can then manage it, and the team's
 * approved image becomes the picture on its card. This is distinct from
 * granting a team a role in the managers panel: ownership is singular, and it's
 * what the card's picture follows.
 *
 * Only teams the user runs are offered (belonging to a team is not licence to
 * publish under its name), so someone with no teams, or only memberships,
 * simply has nothing to choose from.
 */
export const OwnerTeamSection = ({
  description,
  noneAvailable,
}: {
  description: string
  noneAvailable: string
}) => {
  const form = useFormContext<{ ownerTeamId: number | null }>()
  const { t } = useIntl()
  const { data: teams, isLoading, isError } = api.team.managed()

  const options = teams ?? []

  return (
    <FormSection
      title={t({ id: 'ownerTeam.title', defaultMessage: 'Team' })}
      description={description}
    >
      <FormField
        control={form.control}
        name="ownerTeamId"
        render={({ field }) => (
          <FormItem>
            {isLoading ? (
              <div className={TILE_GRID}>
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
              </div>
            ) : isError ? (
              <p className="text-fg-muted text-sm">
                {t({
                  id: 'ownerTeam.loadError',
                  defaultMessage: 'Could not load your teams.',
                })}
              </p>
            ) : (
              <div className="space-y-3">
                <ul className={TILE_GRID}>
                  <TeamTile
                    label={t({
                      id: 'ownerTeam.noneOption',
                      defaultMessage: 'No team',
                    })}
                    selected={field.value == null}
                    onSelect={() => field.onChange(null)}
                  >
                    <UsersRound className="h-6 w-6 text-fg-subtle" aria-hidden="true" />
                  </TeamTile>

                  {options.map((managed) => (
                    <TeamTile
                      key={managed.team.id}
                      label={managed.team.name}
                      caption={managed.roleName}
                      selected={field.value === managed.team.id}
                      onSelect={() => field.onChange(managed.team.id)}
                    >
                      <TeamArt team={managed} />
                    </TeamTile>
                  ))}
                </ul>

                {options.length === 0 && (
                  <p className="rounded-lg border border-line border-dashed p-3 text-fg-muted text-sm">
                    {noneAvailable}{' '}
                    <Link to="/dashboard" className="text-link underline">
                      {t({
                        id: 'ownerTeam.goToTeams',
                        defaultMessage: 'Your teams',
                      })}
                    </Link>
                  </p>
                )}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  )
}
