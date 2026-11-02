import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { initials } from '@/lib/utils'
import {
  roleDisplayName,
  TEAM_ROLE_MEMBER,
  TEAM_ROLE_OWNER,
  TEAM_ROLES,
  TeamDisplayRoleLabel,
  type TeamRole,
} from '@/types/Team'

interface Props {
  teamId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Only an owner may hand out the owner role, so only they see it offered. */
  canAssignOwner: boolean
}

export const InviteMemberDialog = ({ teamId, open, onOpenChange, canAssignOwner }: Props) => {
  const { t } = useIntl()
  const [query, setQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [role, setRole] = useState<TeamRole>(TEAM_ROLE_MEMBER)
  const invite = api.team.useInviteMember()
  const debouncedQuery = useDebouncedValue(query)
  const { data: users = [] } = api.user.findUsers(debouncedQuery, 8, debouncedQuery.length > 0)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelectedUserId(null)
    }
  }, [open])

  const handleInvite = async () => {
    if (!selectedUserId) return
    try {
      await invite.mutateAsync({ teamId, userId: selectedUserId, role })
      toast.success(t({ id: 'teams.inviteMember.sentSuccess', defaultMessage: 'Invitation sent' }))
      onOpenChange(false)
    } catch (error) {
      logger.error('Invite failed', { error })
      toast.error(
        t({ id: 'teams.inviteMember.sendError', defaultMessage: 'Could not send invitation' })
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t({ id: 'teams.inviteMember.title', defaultMessage: 'Invite a team member' })}
          </DialogTitle>
          <DialogDescription>
            {t({
              id: 'teams.inviteMember.description',
              defaultMessage: 'Search for an OSM user and pick a role for them.',
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 size-4 text-zinc-400" aria-hidden="true" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t({
                id: 'common.searchOsmUsername',
                defaultMessage: 'Search OSM username',
              })}
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
          <Select value={String(role)} onValueChange={(v) => setRole(Number(v) as TeamRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEAM_ROLES.filter((option) => option !== TEAM_ROLE_OWNER || canAssignOwner).map(
                (option) => (
                  <SelectItem key={option} value={String(option)}>
                    {TeamDisplayRoleLabel[roleDisplayName(option)]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t({ id: 'common.cancel', defaultMessage: 'Cancel' })}
          </Button>
          <Button onClick={handleInvite} disabled={!selectedUserId || invite.isPending}>
            {t({ id: 'teams.inviteMember.sendButton', defaultMessage: 'Send invitation' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
