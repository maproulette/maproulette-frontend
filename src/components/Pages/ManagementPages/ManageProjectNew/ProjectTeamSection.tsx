import { Link } from '@tanstack/react-router'
import { Check, Users, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { api } from '@/api'
import { FormField, FormItem, FormMessage } from '@/components/ui/Form'
import { FormSection } from '@/components/ui/FormSection'
import { Skeleton } from '@/components/ui/Skeleton'
import { useIntl } from '@/i18n'
import { resolveTeamImageUrl } from '@/lib/teamImage'
import { cn } from '@/lib/utils'
import type { ManagedTeam } from '@/types/Team'
import type { ProjectFormValues } from './projectFormSchema'

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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset',
        selected
          ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500 ring-inset dark:border-blue-400 dark:bg-blue-950/30 dark:ring-blue-400'
          : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-900/50'
      )}
    >
      <span className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded bg-zinc-100 dark:bg-slate-800">
        {children}
      </span>
      <span className="block min-w-0 leading-tight">
        <span className="block truncate text-xs text-zinc-700 dark:text-zinc-300">{label}</span>
        {caption && (
          <span className="block truncate text-[10px] text-zinc-400 dark:text-slate-500">
            {caption}
          </span>
        )}
      </span>
      {selected && (
        <span className="absolute top-1.5 right-1.5 rounded-full bg-blue-500 p-0.5 text-white shadow-sm">
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
    return <Users className="h-6 w-6 text-zinc-400 dark:text-slate-500" aria-hidden="true" />
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
 * Lets the project owner hand the project to one of their teams, the same way a
 * challenge is handed over. The team's owners, admins and managers can then
 * manage it, and the team's approved image becomes the picture on its card.
 *
 * Distinct from granting a team a role on the project, which the project
 * managers panel does: that is one of several teams helping run it. Ownership
 * is singular, and it is what the card's picture follows.
 *
 * Only teams the user runs are offered — belonging to a team is not licence to
 * publish projects under its name — so someone with no teams, or only
 * memberships, simply has nothing to choose from.
 */
export const ProjectTeamSection = () => {
  const form = useFormContext<ProjectFormValues>()
  const { t } = useIntl()
  const { data: teams, isLoading, isError } = api.team.managed()

  const options = teams ?? []

  return (
    <FormSection
      title={t('manageProjectNew.projectForm.teamTitle', undefined, 'Team')}
      description={t(
        'manageProjectNew.projectForm.teamDescription',
        undefined,
        "An optional team to own this project. Everyone who manages that team can run it, and the team's image becomes the picture on its card."
      )}
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
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t(
                  'manageProjectNew.projectForm.teamLoadError',
                  undefined,
                  'Could not load your teams.'
                )}
              </p>
            ) : (
              <div className="space-y-3">
                <ul className={TILE_GRID}>
                  <TeamTile
                    label={t('manageProjectNew.projectForm.teamNoneOption', undefined, 'No team')}
                    selected={field.value == null}
                    onSelect={() => field.onChange(null)}
                  >
                    <UsersRound
                      className="h-6 w-6 text-zinc-400 dark:text-slate-500"
                      aria-hidden="true"
                    />
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
                  <p className="rounded-lg border border-zinc-200 border-dashed p-3 text-sm text-zinc-600 dark:border-slate-700 dark:text-zinc-400">
                    {t(
                      'manageProjectNew.projectForm.teamNoneAvailable',
                      undefined,
                      "You don't manage any teams yet. Only a team's owners, admins and managers can give it a project."
                    )}{' '}
                    <Link
                      to="/dashboard"
                      className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {t('manageProjectNew.projectForm.teamGoToTeams', undefined, 'Your teams')}
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
