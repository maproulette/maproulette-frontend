import { ChevronDown, X } from 'lucide-react'
import { type FormEvent, useId, useState } from 'react'
import { api } from '@/api'
import { useExploreChallengesSearchContext } from '@/components/Pages/ExploreChallengesPage/contexts/ExploreChallengesSearchContext'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import {
  MAX_CATEGORIZATION_KEYWORDS,
  savedCategorizationKeywords,
  withCategorizationKeywords,
} from '@/lib/categorizationKeywords'
import { cn } from '@/lib/utils'

export const CategorizeFilter = () => {
  const { t } = useIntl()
  const { user } = useAuthContext()
  const updateSettings = api.user.useUpdateUserSettings()
  const { selectedCategories, setSelectedCategories } = useExploreChallengesSearchContext()
  const [newKeyword, setNewKeyword] = useState('')
  const inputId = useId()

  const savedKeywords = savedCategorizationKeywords(user?.properties)
  const isFull = savedKeywords.length >= MAX_CATEGORIZATION_KEYWORDS
  const label = t({
    id: 'exploreChallenges.filterBar.categorize.label',
    defaultMessage: 'Categorize',
  })

  const saveKeywords = (keywords: string[]) => {
    if (!user) return
    updateSettings.mutate({
      userId: user.id,
      settings: user.settings ?? {},
      properties: withCategorizationKeywords(user.properties, keywords),
    })
  }

  const toggleKeyword = (keyword: string) => {
    setSelectedCategories((current) =>
      current.includes(keyword) ? current.filter((k) => k !== keyword) : [...current, keyword]
    )
  }

  const removeKeyword = (keyword: string) => {
    setSelectedCategories((current) => current.filter((k) => k !== keyword))
    saveKeywords(savedKeywords.filter((k) => k !== keyword))
  }

  const addKeyword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const keyword = newKeyword.trim()
    if (!user || keyword === '' || isFull || savedKeywords.includes(keyword)) return
    saveKeywords([...savedKeywords, keyword])
    setNewKeyword('')
  }

  return (
    <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
      <Label className="whitespace-nowrap font-medium text-sm text-zinc-700 dark:text-zinc-300">
        {label}
      </Label>
      <Popover>
        <PopoverTrigger
          aria-label={label}
          className="flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-zinc-950 focus-visible:ring-[3px] focus-visible:ring-zinc-950/50 md:w-auto dark:border-slate-700 dark:bg-slate-800 dark:focus-visible:border-zinc-300 dark:focus-visible:ring-zinc-300/50"
        >
          {selectedCategories.length > 0
            ? t(
                {
                  id: 'exploreChallenges.filterBar.categorize.filtersLabel',
                  defaultMessage: '{count, plural, one {# Filter} other {# Filters}}',
                },
                { count: selectedCategories.length }
              )
            : t({ id: 'exploreChallenges.filterBar.workOn.anything', defaultMessage: 'Anything' })}
          <ChevronDown className="size-4 text-zinc-500 dark:text-zinc-400" />
        </PopoverTrigger>
        <PopoverContent align="start" aria-label={label} className="p-1">
          <button
            type="button"
            onClick={() => setSelectedCategories([])}
            className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-slate-800"
          >
            {t({ id: 'exploreChallenges.filterBar.workOn.anything', defaultMessage: 'Anything' })}
          </button>
          {savedKeywords.map((keyword) => {
            const active = selectedCategories.includes(keyword)
            return (
              <div key={keyword} className="flex items-center">
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleKeyword(keyword)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-slate-800',
                    active && 'font-medium text-emerald-700 dark:text-emerald-400'
                  )}
                >
                  {keyword}
                </button>
                <button
                  type="button"
                  aria-label={t(
                    {
                      id: 'exploreChallenges.filterBar.categorize.remove',
                      defaultMessage: 'Remove {keyword}',
                    },
                    { keyword }
                  )}
                  onClick={() => removeKeyword(keyword)}
                  className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            )
          })}
          <div className="mt-1 border-zinc-200 border-t px-2 pt-2 pb-1 text-sm dark:border-slate-800">
            {!user ? (
              <p className="pb-2 text-zinc-500 dark:text-zinc-400">
                {t({
                  id: 'exploreChallenges.filterBar.categorize.signIn',
                  defaultMessage: 'You must sign in to add a keyword.',
                })}
              </p>
            ) : savedKeywords.length === 0 ? (
              <p className="pb-2 text-zinc-500 dark:text-zinc-400">
                {t({
                  id: 'exploreChallenges.filterBar.categorize.none',
                  defaultMessage: 'You have not set any categories.',
                })}
              </p>
            ) : null}
            <form onSubmit={addKeyword} className="flex items-center gap-2">
              <Label htmlFor={inputId} className="text-sm">
                {t({ id: 'exploreChallenges.filterBar.categorize.add', defaultMessage: 'Add:' })}
              </Label>
              <Input
                id={inputId}
                value={newKeyword}
                onChange={(event) => setNewKeyword(event.target.value)}
                disabled={!user || isFull}
                className="h-8"
              />
            </form>
            <p className="pt-2 text-zinc-500 dark:text-zinc-400">
              {isFull
                ? t({
                    id: 'exploreChallenges.filterBar.categorize.full',
                    defaultMessage: 'You must delete a category to add a new one.',
                  })
                : t({
                    id: 'exploreChallenges.filterBar.categorize.addNewCategory',
                    defaultMessage: 'Add a new category',
                  })}
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
