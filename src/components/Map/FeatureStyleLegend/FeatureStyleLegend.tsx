import { ChevronDown, ChevronUp, Palette } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'
import { LegendEntry } from './LegendEntry'
import type { TaskStyleRule } from './styleRuleToText'

interface Props {
  rules: TaskStyleRule[]
  defaultOpen?: boolean
}

export const FeatureStyleLegend = ({ rules, defaultOpen = false }: Props) => {
  const { t } = useIntl()
  const [open, setOpen] = useState(defaultOpen)

  if (!rules || rules.length === 0) return null

  return (
    <div className="rounded-md bg-white/95 shadow-md backdrop-blur dark:bg-slate-900/95">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="flex w-full items-center justify-between gap-2 px-2 py-1 text-xs"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5">
          <Palette className="size-3.5" aria-hidden="true" />{' '}
          {t('map.featureStyleLegend.styles', undefined, 'Styles')}
        </span>
        {open ? (
          <ChevronDown className="size-3.5" aria-hidden="true" />
        ) : (
          <ChevronUp className="size-3.5" aria-hidden="true" />
        )}
      </Button>
      {open && (
        <ul className="space-y-1 border-zinc-200 border-t p-2 dark:border-slate-700">
          {rules.map((rule) => (
            <LegendEntry key={JSON.stringify(rule)} rule={rule} />
          ))}
        </ul>
      )}
    </div>
  )
}
