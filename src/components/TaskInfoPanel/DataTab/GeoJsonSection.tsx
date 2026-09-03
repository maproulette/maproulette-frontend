import { Check, Copy } from 'lucide-react'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { Button } from '@/components/ui/Button'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useIntl } from '@/i18n'

export const GeoJsonSection = () => {
  const { t } = useIntl()
  const { task } = useTaskContext()
  const { copy, isCopied } = useCopyToClipboard()
  const geoJson = JSON.stringify(task.geometries, null, 2)

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => void copy(geoJson)}
        >
          {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {isCopied ? t('common.copied', undefined, 'Copied') : t('common.copy', undefined, 'Copy')}
        </Button>
      </div>
      <pre className="max-h-96 overflow-auto rounded bg-zinc-100 p-2 text-xs text-zinc-900 dark:bg-slate-800/50 dark:text-white">
        {geoJson}
      </pre>
    </div>
  )
}
