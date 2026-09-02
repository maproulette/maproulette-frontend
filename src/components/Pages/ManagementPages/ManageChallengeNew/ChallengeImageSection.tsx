import { Link } from '@tanstack/react-router'
import { Check, ImageOff } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { api } from '@/api'
import { FormField, FormItem, FormMessage } from '@/components/ui/Form'
import { FormSection } from '@/components/ui/FormSection'
import { Skeleton } from '@/components/ui/Skeleton'
import { useIntl } from '@/i18n'
import { resolveTeamImageUrl } from '@/lib/teamImage'
import { cn } from '@/lib/utils'
import type { TeamImage } from '@/types/TeamImage'
import type { ChallengeFormValues } from './challengeFormSchema'

interface ImageTileProps {
  label: string
  selected: boolean
  onSelect: () => void
  children: React.ReactNode
  caption?: string
}

// Tiles live in a fixed-track grid so every option lines up regardless of how
// many teams contributed images. Selection is drawn with an inset ring: the
// form body scrolls, and anything painted outside the border box gets clipped
// against the scroll container's edge.
const TILE_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(6.5rem,7rem))] gap-3'

const ImageTile = ({ label, selected, onSelect, children, caption }: ImageTileProps) => (
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
 * Lets the challenge owner pick a display image from the approved images of
 * the teams they belong to. Images can't be uploaded here — they're requested
 * on the team's page and have to be approved by a super admin first — so a
 * user with no teams, or whose teams have no approved images yet, simply has
 * nothing to choose from.
 */
export const ChallengeImageSection = () => {
  const form = useFormContext<ChallengeFormValues>()
  const { t } = useIntl()
  const { data: images, isLoading, isError } = api.teamImage.available()

  // Images stay grouped by team so a team's options sit together in the grid,
  // but the team name rides along as each tile's caption instead of its own
  // heading row — one heading per image wastes a lot of vertical space when a
  // team has only contributed a picture or two.
  const grouped = (images ?? []).reduce<Map<string, TeamImage[]>>((acc, image) => {
    const key = image.teamName ?? String(image.teamId)
    const existing = acc.get(key)
    if (existing) existing.push(image)
    else acc.set(key, [image])
    return acc
  }, new Map())
  const ordered = [...grouped.entries()].flatMap(([teamName, teamImages]) =>
    teamImages.map((image) => ({ image, teamName }))
  )

  return (
    <FormSection
      title={t('manageChallengeNew.challengeForm.imageTitle', undefined, 'Challenge image')}
      description={t(
        'manageChallengeNew.challengeForm.imageDescription',
        undefined,
        "An optional image shown on this challenge's card, chosen from your teams' approved images."
      )}
    >
      <FormField
        control={form.control}
        name="teamImageId"
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
                  'manageChallengeNew.challengeForm.imageLoadError',
                  undefined,
                  'Could not load your available images.'
                )}
              </p>
            ) : (
              <div className="space-y-3">
                <ul className={TILE_GRID}>
                  <ImageTile
                    label={t(
                      'manageChallengeNew.challengeForm.imageNoneOption',
                      undefined,
                      'No image'
                    )}
                    selected={field.value == null}
                    onSelect={() => field.onChange(null)}
                  >
                    <ImageOff className="h-6 w-6 text-zinc-400 dark:text-slate-500" />
                  </ImageTile>

                  {ordered.map(({ image, teamName }) => (
                    <ImageTile
                      key={image.id}
                      label={image.name}
                      caption={teamName}
                      selected={field.value === image.id}
                      onSelect={() => field.onChange(image.id)}
                    >
                      <img
                        src={resolveTeamImageUrl(image.url)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </ImageTile>
                  ))}
                </ul>

                {ordered.length === 0 && (
                  <p className="rounded-lg border border-zinc-200 border-dashed p-3 text-sm text-zinc-600 dark:border-slate-700 dark:text-zinc-400">
                    {t(
                      'manageChallengeNew.challengeForm.imageNoneAvailable',
                      undefined,
                      "None of your teams have an approved image yet. Request one from your team's page — a super admin has to approve it before it can be used here."
                    )}{' '}
                    <Link
                      to="/dashboard"
                      className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {t(
                        'manageChallengeNew.challengeForm.imageGoToTeams',
                        undefined,
                        'Your teams'
                      )}
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
