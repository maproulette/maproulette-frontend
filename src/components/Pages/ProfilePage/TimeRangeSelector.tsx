import { ToggleGroup, ToggleGroupItem } from '@/components/ui/ToggleGroup'
import { useIntl } from '@/i18n'
import { useProfilePageContext } from './contexts/ProfilePageContext'

const presets: Array<{ labelId: string; defaultLabel: string; monthDuration: number }> = [
  { labelId: 'profilePage.timeRange.oneMonth', defaultLabel: '1m', monthDuration: 1 },
  { labelId: 'profilePage.timeRange.threeMonths', defaultLabel: '3m', monthDuration: 3 },
  { labelId: 'profilePage.timeRange.sixMonths', defaultLabel: '6m', monthDuration: 6 },
  { labelId: 'profilePage.timeRange.nineMonths', defaultLabel: '9m', monthDuration: 9 },
  { labelId: 'profilePage.timeRange.twelveMonths', defaultLabel: '12m', monthDuration: 12 },
  { labelId: 'profilePage.timeRange.all', defaultLabel: 'All', monthDuration: -1 },
]

export const TimeRangeSelector = () => {
  const { t } = useIntl()
  const { timeRange, setMonthDuration } = useProfilePageContext()

  return (
    <ToggleGroup
      type="single"
      value={String(timeRange.monthDuration)}
      onValueChange={(value) => {
        if (!value) return
        setMonthDuration(Number(value))
      }}
      aria-label={t({ id: 'profilePage.timeRange.ariaLabel', defaultMessage: 'Time range' })}
    >
      {presets.map((preset) => (
        <ToggleGroupItem key={preset.monthDuration} value={String(preset.monthDuration)}>
          {t({ id: preset.labelId, defaultMessage: preset.defaultLabel })}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
