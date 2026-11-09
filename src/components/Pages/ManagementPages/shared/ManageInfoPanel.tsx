import { PanelLeftClose } from 'lucide-react'
import type { ReactNode } from 'react'
import { DocsLink } from '@/components/shared/DocsLink'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'
import type { DocsPage } from '@/lib/documentationLinks'

type ManageInfoPanelSection = {
  id: string
  title: ReactNode
  description: ReactNode
}

type ManageInfoPanelDocsSection = {
  page: DocsPage
  text: ReactNode
}

interface ManageInfoPanelProps {
  title: ReactNode
  description: ReactNode
  sections: ManageInfoPanelSection[]
  docs: ManageInfoPanelDocsSection[]
  onClose: () => void
}

export const ManageInfoPanel = ({
  title,
  description,
  sections,
  docs,
  onClose,
}: ManageInfoPanelProps) => {
  const { t } = useIntl()
  return (
    <aside className="h-full min-h-0 overflow-hidden">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200/40 bg-white shadow-sm dark:border-slate-700/40 dark:bg-slate-800">
        <div className="flex items-start justify-between px-6 pt-6">
          <div className="space-y-2.5">
            <h2 className="font-bold text-base text-zinc-900 leading-tight tracking-tight dark:text-zinc-50">
              {title}
            </h2>
            <p className="text-pretty text-sm text-zinc-600 leading-relaxed dark:text-zinc-400">
              {description}
            </p>
          </div>
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

        <div className="my-4 border-zinc-200/50 border-b dark:border-slate-700/50" />

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="space-y-4 text-sm text-zinc-600 leading-relaxed dark:text-zinc-300">
            {sections.map((s) => {
              return (
                <div key={s.id}>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{s.title}</p>
                  <p>{s.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-auto border-zinc-200/50 border-t bg-zinc-50/50 px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800/50">
          <p className="mb-1 font-medium text-sm text-zinc-700 dark:text-zinc-300">
            {t({
              id: 'managementPages.manageInfoPanel.documentation',
              defaultMessage: 'Documentation',
            })}
          </p>
          <div className="flex flex-col space-y-2">
            {docs.map((d) => {
              return (
                <DocsLink
                  key={d.page}
                  page={d.page}
                  className="gap-2 text-xs text-zinc-700 no-underline hover:underline dark:text-zinc-200"
                >
                  {d.text}
                </DocsLink>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
