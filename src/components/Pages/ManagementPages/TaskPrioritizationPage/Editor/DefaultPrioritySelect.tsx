import { Label } from '@/components/ui/Label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import {
  PRIORITY_COLOR,
  PRIORITY_MESSAGES,
  PRIORITY_TIERS,
  type TaskPriorityValue,
} from '@/types/Priority'
import { usePrioritizationContext } from '../PrioritizationContext'

export const DefaultPrioritySelect = () => {
  const { t } = useIntl()
  const { draft, setDefaultPriority } = usePrioritizationContext()
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Label className="text-sm text-zinc-700 dark:text-slate-200">
        {t({
          id: 'taskPrioritizationPage.defaultPrioritySelect.label',
          defaultMessage: 'Default priority',
        })}
      </Label>
      <RadioGroup
        className="auto-cols-max grid-flow-col gap-4"
        value={String(draft.defaultPriority)}
        onValueChange={(v) => setDefaultPriority(Number(v) as TaskPriorityValue)}
      >
        {PRIORITY_TIERS.map((p) => {
          const id = `default-priority-${p}`
          return (
            <div key={p} className="flex items-center gap-1.5">
              <RadioGroupItem id={id} value={String(p)} />
              <Label htmlFor={id} className="gap-1.5 font-normal">
                <span className={cn('size-2 rounded-full', PRIORITY_COLOR[p].bg)} />
                {t(PRIORITY_MESSAGES[p])}
              </Label>
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )
}
