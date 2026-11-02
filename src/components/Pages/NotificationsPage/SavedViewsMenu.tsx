import { BookmarkIcon, CheckIcon, PencilIcon, PlusIcon, TrashIcon, XIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Input } from '@/components/ui/Input'
import { useNotificationsPageContext } from '@/contexts/NotificationsPageContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { loadSavedViews, persistSavedViews, SAVED_VIEWS_KEY, type SavedView } from './savedViews'

export const SavedViewsMenu = () => {
  const { t } = useIntl()
  const { filters } = useNotificationsPageContext()
  const { currentState, applyFilterState, hasActiveFilters } = filters

  const [views, setViews] = useState<SavedView[]>(() => loadSavedViews())
  const [isOpen, setIsOpen] = useState(false)
  const [isNaming, setIsNaming] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  // Reason: keep state in sync if storage is updated in another tab.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === SAVED_VIEWS_KEY) {
        setViews(loadSavedViews())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const resetNamingState = useCallback(() => {
    setIsNaming(false)
    setNewName('')
  }, [])

  const resetEditingState = useCallback(() => {
    setEditingId(null)
    setEditingName('')
  }, [])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open)
      if (!open) {
        resetNamingState()
        resetEditingState()
      }
    },
    [resetNamingState, resetEditingState]
  )

  const handleSaveCurrent = () => {
    const name = newName.trim()
    if (!name) {
      toast.error(
        t({
          id: 'notificationsPage.savedViews.nameRequired',
          defaultMessage: 'View name is required',
        })
      )
      return
    }
    const next: SavedView = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      state: { ...currentState },
    }
    const updated = [...views, next]
    try {
      persistSavedViews(updated)
      setViews(updated)
      resetNamingState()
      toast.success(
        t(
          { id: 'notificationsPage.savedViews.saved', defaultMessage: 'Saved view "{name}"' },
          { name }
        )
      )
    } catch {
      toast.error(
        t({ id: 'notificationsPage.savedViews.saveFailed', defaultMessage: 'Failed to save view' })
      )
    }
  }

  const handleApply = (view: SavedView) => {
    applyFilterState(view.state)
    setIsOpen(false)
    toast.success(
      t(
        { id: 'notificationsPage.savedViews.applied', defaultMessage: 'Applied view "{name}"' },
        { name: view.name }
      )
    )
  }

  const handleDelete = (id: string) => {
    const updated = views.filter((v) => v.id !== id)
    try {
      persistSavedViews(updated)
      setViews(updated)
      toast.success(
        t({ id: 'notificationsPage.savedViews.deleted', defaultMessage: 'View deleted' })
      )
    } catch {
      toast.error(
        t({
          id: 'notificationsPage.savedViews.deleteFailed',
          defaultMessage: 'Failed to delete view',
        })
      )
    }
  }

  const handleStartRename = (view: SavedView) => {
    setEditingId(view.id)
    setEditingName(view.name)
  }

  const handleCommitRename = (id: string) => {
    const name = editingName.trim()
    if (!name) {
      toast.error(
        t({
          id: 'notificationsPage.savedViews.nameRequired',
          defaultMessage: 'View name is required',
        })
      )
      return
    }
    const updated = views.map((v) => (v.id === id ? { ...v, name } : v))
    try {
      persistSavedViews(updated)
      setViews(updated)
      resetEditingState()
      toast.success(
        t({ id: 'notificationsPage.savedViews.renamed', defaultMessage: 'View renamed' })
      )
    } catch {
      toast.error(
        t({
          id: 'notificationsPage.savedViews.renameFailed',
          defaultMessage: 'Failed to rename view',
        })
      )
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <BookmarkIcon className="size-4" />
          <span>
            {t({ id: 'notificationsPage.savedViews.title', defaultMessage: 'Saved views' })}
          </span>
          {views.length > 0 ? (
            <span className="ml-1 rounded-full bg-zinc-100 px-1.5 text-xs text-zinc-700 dark:bg-slate-700 dark:text-slate-200">
              {views.length}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs text-zinc-500 uppercase tracking-wide dark:text-slate-400">
          {t({ id: 'notificationsPage.savedViews.title', defaultMessage: 'Saved views' })}
        </DropdownMenuLabel>
        {views.length === 0 ? (
          <div className="px-2 py-3 text-sm text-zinc-500 dark:text-slate-400">
            {t({ id: 'notificationsPage.savedViews.empty', defaultMessage: 'No saved views yet.' })}
          </div>
        ) : (
          views.map((view) =>
            editingId === view.id ? (
              <div key={view.id} className="flex items-center gap-1 px-2 py-1.5">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCommitRename(view.id)
                    } else if (e.key === 'Escape') {
                      e.preventDefault()
                      resetEditingState()
                    }
                  }}
                  autoFocus
                  className="h-7 text-sm"
                  aria-label={t({
                    id: 'notificationsPage.savedViews.renameInputLabel',
                    defaultMessage: 'Rename saved view',
                  })}
                />
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => handleCommitRename(view.id)}
                  aria-label={t({
                    id: 'notificationsPage.savedViews.saveName',
                    defaultMessage: 'Save name',
                  })}
                >
                  <CheckIcon className="size-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={resetEditingState}
                  aria-label={t({
                    id: 'notificationsPage.savedViews.cancelRename',
                    defaultMessage: 'Cancel rename',
                  })}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ) : (
              <DropdownMenuItem
                key={view.id}
                onSelect={(e) => {
                  // Reason: we close manually via handleApply so the action feedback is explicit.
                  e.preventDefault()
                  handleApply(view)
                }}
                className="group flex items-center gap-2"
              >
                <span className="flex-1 truncate">{view.name}</span>
                <button
                  type="button"
                  className={cn(
                    'rounded p-1 text-zinc-500 opacity-0 transition-opacity',
                    'hover:bg-zinc-100 hover:text-zinc-900 group-hover:opacity-100',
                    'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-zinc-50'
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartRename(view)
                  }}
                  aria-label={t(
                    {
                      id: 'notificationsPage.savedViews.renameAction',
                      defaultMessage: 'Rename {name}',
                    },
                    { name: view.name }
                  )}
                >
                  <PencilIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  className={cn(
                    'rounded p-1 text-zinc-500 opacity-0 transition-opacity',
                    'hover:bg-red-50 hover:text-red-600 group-hover:opacity-100',
                    'dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400'
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(view.id)
                  }}
                  aria-label={t(
                    {
                      id: 'notificationsPage.savedViews.deleteAction',
                      defaultMessage: 'Delete {name}',
                    },
                    { name: view.name }
                  )}
                >
                  <TrashIcon className="size-3.5" />
                </button>
              </DropdownMenuItem>
            )
          )
        )}
        <DropdownMenuSeparator />
        {isNaming ? (
          <div className="flex items-center gap-1 px-2 py-1.5">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSaveCurrent()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  resetNamingState()
                }
              }}
              autoFocus
              placeholder={t({
                id: 'notificationsPage.savedViews.namePlaceholder',
                defaultMessage: 'View name',
              })}
              className="h-7 text-sm"
              aria-label={t({
                id: 'notificationsPage.savedViews.newNameLabel',
                defaultMessage: 'Saved view name',
              })}
            />
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={handleSaveCurrent}
              aria-label={t({
                id: 'notificationsPage.savedViews.saveView',
                defaultMessage: 'Save view',
              })}
            >
              <CheckIcon className="size-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={resetNamingState}
              aria-label={t({
                id: 'notificationsPage.savedViews.cancelSave',
                defaultMessage: 'Cancel save',
              })}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        ) : (
          <DropdownMenuItem
            disabled={!hasActiveFilters}
            onSelect={(e) => {
              e.preventDefault()
              setIsNaming(true)
            }}
          >
            <PlusIcon className="size-4" />
            <span>
              {t({
                id: 'notificationsPage.savedViews.saveCurrentAs',
                defaultMessage: 'Save current as…',
              })}
            </span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
