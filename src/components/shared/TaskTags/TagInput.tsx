import { useState } from 'react'
import { api } from '@/api'
import { Input } from '@/components/ui/Input'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { TagChip } from './TagChip'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
  preferredTags?: string[]
  limitToPreferred?: boolean
  placeholder?: string
}

const normalize = (tag: string) => tag.trim().toLowerCase()

export const TagInput = ({
  value,
  onChange,
  preferredTags = [],
  limitToPreferred = false,
  placeholder,
}: Props) => {
  const { t } = useIntl()
  const resolvedPlaceholder =
    placeholder ?? t('taskTags.tagInput.addTagPlaceholder', undefined, 'Add a tag…')
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debouncedInput = useDebouncedValue(input)
  const { data: suggestions = [] } = api.task.searchKeywords(debouncedInput, 'tasks', 6)

  const preferredSet = new Set(preferredTags.map(normalize))
  const valueSet = new Set(value.map(normalize))

  const addTag = (raw: string) => {
    const name = normalize(raw)
    if (!name || valueSet.has(name)) return
    if (limitToPreferred && !preferredSet.has(name)) return
    onChange([...value, name])
    setInput('')
  }

  const removeTag = (raw: string) => {
    const name = normalize(raw)
    onChange(value.filter((t) => normalize(t) !== name))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      addTag(input)
      return
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      e.preventDefault()
      removeTag(value[value.length - 1])
    }
  }

  const availablePreferred = preferredTags.filter((t) => !valueSet.has(normalize(t)))

  return (
    <div className="space-y-2">
      {availablePreferred.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-zinc-500 dark:text-slate-400">
            {t('taskTags.tagInput.popularInChallenge', undefined, 'Popular in this challenge:')}
          </span>
          {availablePreferred.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="inline-flex items-center rounded-full border border-teal-500 bg-white px-2 py-0.5 text-teal-700 text-xs hover:bg-teal-50 dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-teal-950/40"
            >
              {t('taskTags.tagInput.addPreferredTag', { tag }, '+ {tag}')}
            </button>
          ))}
        </div>
      )}
      <div
        className={cn(
          'flex min-h-10 flex-wrap items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 dark:border-slate-700'
        )}
      >
        {value.map((tag) => (
          <TagChip
            key={tag}
            label={tag}
            preferred={preferredSet.has(normalize(tag))}
            onRemove={() => removeTag(tag)}
          />
        ))}
        <Input
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setShowSuggestions(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
          placeholder={resolvedPlaceholder}
          className="h-7 min-w-32 flex-1 border-0 shadow-none focus-visible:ring-0"
          disabled={limitToPreferred}
        />
      </div>
      {showSuggestions && input && suggestions.length > 0 && (
        <ul className="max-h-40 overflow-auto rounded-md border border-zinc-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {suggestions
            .filter((s) => !valueSet.has(normalize(s.name)))
            .map((s) => (
              <li key={s.id ?? s.name}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    addTag(s.name)
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-slate-800"
                >
                  {s.name}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
