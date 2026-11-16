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
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200/40 bg-white p-6 shadow-sm dark:border-slate-700/40 dark:bg-slate-800">
        <div className="flex items-start justify-between">
          <h2 className="font-bold text-base text-zinc-900 leading-tight tracking-tight dark:text-zinc-50">
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
              className="gap-2 text-sm text-zinc-700 no-underline hover:underline dark:text-zinc-200"
            >
              {d.text}
            </DocsLink>
          ))}
        </div>
      </div>
    </aside>
  )
}
