import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog'
import { Loader } from '@/components/ui/Loader'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable'
import { useIntl } from '@/i18n'
import { InviteMemberDialog } from '../InviteMemberDialog'
import { TeamContentPanel } from './TeamContentPanel'
import { TeamDetailProvider, useTeamDetailContext } from './TeamDetailContext'
import { TeamDetailSidebar } from './TeamDetailSidebar'

const TeamDetailLayout = () => {
  const { t } = useIntl()
  const {
    teamId,
    team,
    isLoading,
    iAmOwner,
    inviteOpen,
    setInviteOpen,
    confirmDelete,
    setConfirmDelete,
    handleDelete,
  } = useTeamDetailContext()

  if (isLoading) return <Loader />
  if (!team) {
    return (
      <div className="py-12 text-center text-zinc-500">
        {t('common.teamNotFound', undefined, 'Team not found.')}
      </div>
    )
  }

  return (
    <div className="h-full p-4">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
          <aside className="h-full min-h-0 overflow-hidden pr-2">
            <TeamDetailSidebar />
          </aside>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={70} minSize={40}>
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200/40 bg-white shadow-sm dark:border-slate-700/40 dark:bg-slate-800">
            <TeamContentPanel />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <InviteMemberDialog
        teamId={teamId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        canAssignOwner={iAmOwner}
      />
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('teams.detail.deleteConfirmTitle', undefined, 'Delete this team?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'teams.detail.deleteConfirmDescription',
                undefined,
                'This cannot be undone. All members will lose access.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', undefined, 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t('teams.detail.deleteConfirmAction', undefined, 'Delete team')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export const TeamDetailPage = ({ teamId }: { teamId: number }) => (
  <TeamDetailProvider teamId={teamId}>
    <TeamDetailLayout />
  </TeamDetailProvider>
)
