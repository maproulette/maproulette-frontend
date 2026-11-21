import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { FolderOpen, ListTodo, Search, Target } from 'lucide-react'
import { useId, useMemo, useRef, useState } from 'react'
import { api } from '@/api'
import { searchByIdOptions } from '@/api/search'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/InputGroup'
import { KbdBinding } from '@/components/ui/Kbd'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/Popover'
import { Spinner } from '@/components/ui/Spinner'
import { type KeyboardShortcut, useRegisterShortcuts } from '@/contexts/KeyboardShortcutsContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

const CHALLENGE_LIMIT = 6
const PROJECT_LIMIT = 4

type Result = { kind: 'project' | 'challenge' | 'task'; id: number; name: string }

const resultLink = ({ kind, id }: Result) => {
  switch (kind) {
    case 'project':
      return { to: '/project/$projectId', params: { projectId: String(id) } } as const
    case 'challenge':
      return { to: '/challenge/$challengeId', params: { challengeId: String(id) } } as const
    case 'task':
      return { to: '/tasks/$taskId', params: { taskId: String(id) } } as const
  }
}

const resultIcons = { project: FolderOpen, challenge: Target, task: ListTodo }

const useResults = (query: string) => {
  const { t } = useIntl()
  const id = /^\d+$/.test(query) ? Number(query) : 0
  const name = id ? '' : query

  const challenges = api.challenge.searchChallenges({ search: name, limit: CHALLENGE_LIMIT })
  const projects = api.project.searchProjects({ search: name, limit: PROJECT_LIMIT })
  const byId = useQuery(searchByIdOptions(id))
  const taskChallenge = api.challenge.getChallenge(byId.data?.task?.parent ?? 0)

  const groups = useMemo(() => {
    if (id) {
      const { project, challenge, task } = byId.data ?? {}
      const results: Result[] = []
      if (project) {
        results.push({ kind: 'project', id, name: project.displayName || project.name })
      }
      if (challenge) results.push({ kind: 'challenge', id, name: challenge.name })
      // Task names are mostly generated IDs, so label tasks by their challenge instead.
      if (task && taskChallenge.data) {
        results.push({
          kind: 'task',
          id,
          name: t(
            {
              id: 'appLayout.header.globalSearch.taskInChallenge',
              defaultMessage: 'Task {id} in Challenge "{challenge}"',
            },
            { id: String(id), challenge: taskChallenge.data.name }
          ),
        })
      }
      return [
        {
          label: t(
            { id: 'appLayout.header.globalSearch.idHeading', defaultMessage: 'ID {id}' },
            { id: String(id) }
          ),
          results,
        },
      ]
    }
    return [
      {
        label: t({ id: 'common.challenges', defaultMessage: 'Challenges' }),
        results: (challenges.data ?? []).map(
          (c): Result => ({ kind: 'challenge', id: c.id, name: c.name })
        ),
      },
      {
        label: t({ id: 'common.projects', defaultMessage: 'Projects' }),
        results: (projects.data ?? []).map(
          (p): Result => ({ kind: 'project', id: p.id, name: p.displayName || p.name })
        ),
      },
    ]
  }, [id, byId.data, taskChallenge.data, challenges.data, projects.data, t])

  const isFetching = id
    ? byId.isFetching || taskChallenge.isFetching
    : challenges.isFetching || projects.isFetching
  return { groups: groups.filter((g) => g.results.length > 0), isFetching }
}

export const GlobalSearch = ({ className, ...props }: React.ComponentProps<'search'>) => {
  const { t } = useIntl()
  const navigate = useNavigate()
  const id = useId()
  const listId = `${id}-results`
  const inputRef = useRef<HTMLInputElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const query = input.trim()
  const debouncedQuery = useDebouncedValue(query)
  const { groups, isFetching } = useResults(debouncedQuery)
  const results = groups.flatMap((g) => g.results)
  const active = Math.min(activeIndex, results.length - 1)
  const isPending = isFetching || query !== debouncedQuery
  const optionId = (index: number) => `${id}-option-${index}`

  const placeholder = t({
    id: 'appLayout.header.globalSearch.placeholder',
    defaultMessage: 'Search challenges and projects, or enter an ID',
  })

  const searchShortcuts: KeyboardShortcut[] = useMemo(
    () => [
      {
        key: 'k',
        ctrlOrCmd: true,
        description: t({
          id: 'header.globalSearch.shortcut',
          defaultMessage: 'Search MapRoulette',
        }),
        category: 'general',
        // The Ctrl/Cmd tier is the one that keeps working while the mapper is
        // typing, which is the point of it: search is always one key away.
        allowWhileTyping: true,
        handler: () => {
          inputRef.current?.focus()
          inputRef.current?.select()
        },
      },
    ],
    [t]
  )
  useRegisterShortcuts('global-search', searchShortcuts)

  const close = () => {
    setIsOpen(false)
    setInput('')
    inputRef.current?.blur()
  }

  const moveActive = (delta: number) => {
    if (results.length === 0) return
    const next = Math.max(0, Math.min(active + delta, results.length - 1))
    setActiveIndex(next)
    document.getElementById(optionId(next))?.scrollIntoView({ block: 'nearest' })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIsOpen(true)
      moveActive(1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      moveActive(-1)
    } else if (e.key === 'Enter' && isOpen && results[active]) {
      e.preventDefault()
      navigate(resultLink(results[active]))
      close()
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault()
      setIsOpen(false)
    }
  }

  const showPopover = isOpen && query.length > 0
  let index = 0

  return (
    <search className={className} {...props}>
      <Popover open={showPopover} onOpenChange={setIsOpen}>
        <PopoverAnchor asChild>
          <div ref={anchorRef}>
            <InputGroup className="rounded-[20px] py-5">
              <label htmlFor={id} className="sr-only">
                {placeholder}
              </label>
              <InputGroupInput
                ref={inputRef}
                id={id}
                type="search"
                role="combobox"
                placeholder={placeholder}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setActiveIndex(0)
                  setIsOpen(true)
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                aria-autocomplete="list"
                aria-controls={listId}
                aria-expanded={showPopover}
                aria-activedescendant={showPopover && active >= 0 ? optionId(active) : undefined}
                autoComplete="off"
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                {/* Rendered from the binding, so a mapper on Windows or Linux
                    is shown Ctrl rather than a key their keyboard lacks. */}
                <KbdBinding binding={searchShortcuts[0]} />
              </InputGroupAddon>
            </InputGroup>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) min-w-72 max-w-[720px] p-1.5"
          aria-label={placeholder}
          // Focus stays in the input; the options are driven by aria-activedescendant.
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) e.preventDefault()
          }}
        >
          <div id={listId} role="listbox" aria-busy={isPending}>
            {groups.map((group) => (
              // biome-ignore lint/a11y/useSemanticElements: a fieldset isn't valid inside a listbox
              <div key={group.label} role="group" aria-label={group.label}>
                <div className="px-2 pt-2 pb-1 font-medium text-fg-muted text-xs">
                  {group.label}
                </div>
                {group.results.map((result) => {
                  const i = index++
                  const Icon = resultIcons[result.kind]
                  return (
                    <Link
                      key={`${result.kind}-${result.id}`}
                      {...resultLink(result)}
                      id={optionId(i)}
                      role="option"
                      aria-selected={i === active}
                      tabIndex={-1}
                      onClick={close}
                      onMouseMove={() => setActiveIndex(i)}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-fg text-sm',
                        i === active && 'bg-muted'
                      )}
                    >
                      <Icon className="size-4 shrink-0 text-fg-muted" />
                      <span className="truncate">{result.name}</span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
          {results.length === 0 && (
            <div className="flex justify-center px-2 py-4 text-fg-muted text-sm">
              {isPending ? (
                <Spinner />
              ) : (
                t({ id: 'common.noResultsFound', defaultMessage: 'No results found' })
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </search>
  )
}
