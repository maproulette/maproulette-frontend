import { Search } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { useIntl } from '@/i18n'
import { initials } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (userId: number) => void
  count: number
  busy?: boolean
}

export const BulkReassignDialog = ({ open, onOpenChange, onConfirm, count, busy }: Props) => {
  const { t } = useIntl()
  const [query, setQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const { data: users = [] } = api.user.findUsers(query, 8, query.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {t(
              'managementPages.bulkActionsToolbar.reassignDialog.title',
              { count },
              '{count, plural, one {Reassign # task} other {Reassign # tasks}}'
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              'managementPages.bulkActionsToolbar.reassignDialog.description',
              undefined,
              'Search for the reviewer to assign these task reviews to. Only tasks whose reviews are still open will be updated.'
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 size-4 text-zinc-400" aria-hidden="true" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('common.searchOsmUsername', undefined, 'Search OSM username')}
              className="pl-8"
            />
          </div>
          {users.length > 0 && (
            <ul className="max-h-56 overflow-auto rounded-md border border-zinc-200 dark:border-slate-700">
              {users.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedUserId(u.id)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                      selectedUserId === u.id
                        ? 'bg-teal-50 dark:bg-teal-900/40'
                        : 'hover:bg-zinc-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Avatar className="size-6">
                      <AvatarImage src={u.avatarURL} alt={u.displayName} />
                      <AvatarFallback>{initials(u.displayName)}</AvatarFallback>
                    </Avatar>
                    {u.displayName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t('common.cancel', undefined, 'Cancel')}
          </Button>
          <Button
            onClick={() => selectedUserId && onConfirm(selectedUserId)}
            disabled={!selectedUserId || busy}
          >
            {busy
              ? t(
                  'managementPages.bulkActionsToolbar.reassignDialog.reassigning',
                  undefined,
                  'Reassigning…'
                )
              : t('managementPages.bulkActionsToolbar.reassign', undefined, 'Reassign')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
