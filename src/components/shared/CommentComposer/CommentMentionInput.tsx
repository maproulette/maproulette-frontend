import { useEffect, useRef, useState } from 'react'
import { api } from '@/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Textarea } from '@/components/ui/Textarea'
import { useIntl } from '@/i18n'
import { cn, initials } from '@/lib/utils'
import { findMention, insertMention, type MentionMatch } from './mentionUtils'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  onSubmitShortcut?: () => void
}

const useDebounced = (value: string, delay = 250) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  return debounced
}

export const CommentMentionInput = ({
  value,
  onChange,
  placeholder,
  maxLength = 1000,
  disabled,
  onSubmitShortcut,
}: Props) => {
  const { t } = useIntl()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [match, setMatch] = useState<MentionMatch | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const debouncedQuery = useDebounced(match?.query ?? '', 250)
  const { data: users = [] } = api.user.findUsers(
    debouncedQuery,
    6,
    !!match && debouncedQuery.length > 0
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [match, users])

  const pickUser = (displayName: string) => {
    if (!match) return
    const { text, newCursor } = insertMention(value, match, displayName)
    onChange(text)
    setMatch(null)
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(newCursor, newCursor)
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value
    onChange(next)
    const cursor = e.target.selectionStart ?? next.length
    setMatch(findMention(next, cursor))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (match && users.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % users.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + users.length) % users.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        const picked = users[selectedIndex]
        if (picked) pickUser(picked.displayName)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMatch(null)
        return
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      onSubmitShortcut?.()
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        rows={4}
        className="resize-y"
      />
      {match && users.length > 0 && (
        <div
          role="listbox"
          aria-label={t(
            'shared.commentComposer.mention.userSuggestions',
            undefined,
            'User suggestions'
          )}
          className="absolute z-20 mt-1 max-h-60 w-full min-w-56 overflow-auto rounded-md border border-zinc-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {users.map((u, i) => (
            <button
              type="button"
              key={u.id}
              role="option"
              aria-selected={i === selectedIndex}
              tabIndex={-1}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm',
                i === selectedIndex && 'bg-teal-50 dark:bg-teal-900/40'
              )}
              onMouseDown={(e) => {
                e.preventDefault()
                pickUser(u.displayName)
              }}
            >
              <Avatar className="size-6">
                <AvatarImage src={u.avatarURL} alt={u.displayName} />
                <AvatarFallback>{initials(u.displayName)}</AvatarFallback>
              </Avatar>
              <span>{u.displayName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
