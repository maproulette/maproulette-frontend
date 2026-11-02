import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { useIntl } from '@/i18n'
import { useChallengeModals } from './ChallengeModalsContext'

export const OverpassModal = () => {
  const { t } = useIntl()
  const { challenge } = useBrowsedChallengeContext()
  const { isOverpassModalOpen, setOverpassOpen } = useChallengeModals()

  return (
    <Dialog open={isOverpassModalOpen} onOpenChange={setOverpassOpen}>
      <DialogContent size="2xl" className="flex max-h-[80vh] flex-col">
        <DialogHeader>
          <DialogTitle>
            {t({ id: 'common.overpassQuery', defaultMessage: 'Overpass Query' })}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-slate-700 dark:bg-slate-900">
              <textarea
                readOnly
                value={challenge.overpassQL || ''}
                className="h-full w-full resize-none rounded-lg border-0 bg-transparent p-4 font-mono text-sm text-zinc-900 focus:outline-none dark:text-white"
                style={{ minHeight: '400px' }}
              />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
