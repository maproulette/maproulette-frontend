import { Link } from '@tanstack/react-router'
import { Check, ImageOff } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { api } from '@/api'
import { FormField, FormItem, FormMessage } from '@/components/ui/Form'
import { FormSection } from '@/components/ui/FormSection'
import { Skeleton } from '@/components/ui/Skeleton'
import { useIntl } from '@/i18n'
import { resolveTeamImageUrl } from '@/lib/teamImage'
import { cn } from '@/lib/utils'
import type { TeamImage } from '@/types/TeamImage'
import type { ChallengeFormValues } from './challengeFormSchema'

interface ChallengeImageSectionProps {
  form: UseFormReturn<ChallengeFormValues>
}

interface ImageTileProps {
  label: string
  selected: boolean
  onSelect: () => void
  children: React.ReactNode
  caption?: string
}

const ImageTile = ({ label, selected, onSelect, children, caption }: ImageTileProps) => (
  <li>
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title={label}
      className={cn(
        'group relative flex w-24 flex-col gap-1 rounded-lg border border-zinc-200 p-2 text-left transition-all dark:border-slate-700',
        selected
          ? 'bg-blue-50/60 ring-2 ring-blue-500 dark:bg-blue-950/30 dark:ring-blue-400'
          : 'hover:bg-zinc-50 dark:hover:bg-slate-900/50'
      )}
    >
      <span className="flex h-16 w-full items-center justify-center overflow-hidden rounded bg-zinc-100 dark:bg-slate-800">
        {children}
      </span>
      <span className="truncate text-xs text-zinc-600 dark:text-zinc-400">{label}</span>
      {caption && (
        <span className="truncate text-[10px] text-zinc-400 dark:text-slate-500">{caption}</span>
      )}
      {selected && (
        <span className="absolute top-1 right-1 rounded-full bg-blue-500 p-0.5 text-white">
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
export const ChallengeImageSection = ({ form }: ChallengeImageSectionProps) => {
  const { t } = useIntl()
  const { data: images, isLoading, isError } = api.teamImage.available()

  const grouped = (images ?? []).reduce<Map<string, TeamImage[]>>((acc, image) => {
    const key = image.teamName ?? String(image.teamId)
    const existing = acc.get(key)
    if (existing) existing.push(image)
    else acc.set(key, [image])
    return acc
  }, new Map())

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
              <div className="flex gap-2">
                <Skeleton className="h-24 w-24" />
                <Skeleton className="h-24 w-24" />
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
              <div className="space-y-4">
                <ul className="flex flex-wrap gap-2">
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
                </ul>

                {[...grouped.entries()].map(([teamName, teamImages]) => (
                  <div key={teamName} className="space-y-2">
                    <p className="font-medium text-xs text-zinc-500 dark:text-slate-400">
                      {teamName}
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {teamImages.map((image) => (
                        <ImageTile
                          key={image.id}
                          label={image.name}
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
                  </div>
                ))}

                {grouped.size === 0 && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
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
