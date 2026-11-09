import { useId } from 'react'
import { useExploreChallengesSearchContext } from '@/components/Pages/ExploreChallengesPage/contexts/ExploreChallengesSearchContext'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/Switch'
import { useIntl } from '@/i18n'

export const GlobalToggle = () => {
  const { t } = useIntl()
  const { global, setGlobal } = useExploreChallengesSearchContext()
  const globalId = useId()

  return (
    <Label htmlFor={globalId} className="flex cursor-pointer items-center gap-2 whitespace-nowrap">
      <Switch
        id={globalId}
        checked={global ?? false}
        onCheckedChange={(checked) => setGlobal(checked)}
      />
      <span className="text-sm text-zinc-700 dark:text-zinc-300">
        {t({ id: 'common.global', defaultMessage: 'Global' })}
      </span>
    </Label>
  )
}
