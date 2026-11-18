import { PanelLeftClose } from 'lucide-react'
import type { ReactNode } from 'react'
import { DocsLink } from '@/components/shared/DocsLink'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'
import type { DocsPage } from '@/lib/documentationLinks'

interface ManageInfoPanelProps {
  docs: { page: DocsPage; text: ReactNode }[]
  onClose: () => void
}

export const ManageInfoPanel = ({ docs, onClose }: ManageInfoPanelProps) => {
  const { t } = useIntl()
  return (
    <aside className="h-full min-h-0 overflow-hidden">
      <div className="flex h-full flex-col overflow-hidden rounded-lg border-gradient bg-panel p-6">
        <div className="flex items-start justify-between">
          <h2 className="font-bold text-base text-fg leading-tight tracking-tight">
            {t({
              id: 'managementPages.manageInfoPanel.documentation',
              defaultMessage: 'Documentation',
            })}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onClose()}
            title={t({ id: 'common.hidePanel', defaultMessage: 'Hide panel' })}
          >
            <PanelLeftClose className="size-4" />
          </Button>
        </div>
        <div className="mt-2 flex flex-col space-y-2">
          {docs.map((d) => (
            <DocsLink
              key={d.page}
              page={d.page}
              className="gap-2 text-fg text-sm no-underline hover:underline"
            >
              {d.text}
            </DocsLink>
          ))}
        </div>
      </div>
    </aside>
  )
}
