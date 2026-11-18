import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useIntl } from '@/i18n'
import type { Task } from '@/types/Task'

export const GeoJsonSection = ({ task }: { task: Task }) => {
  const { t } = useIntl()
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
          {isCopied
            ? t({ id: 'common.copied', defaultMessage: 'Copied' })
            : t({ id: 'common.copy', defaultMessage: 'Copy' })}
        </Button>
      </div>
      <pre className="max-h-96 overflow-auto rounded bg-muted p-2 text-fg text-xs">{geoJson}</pre>
    </div>
  )
}
