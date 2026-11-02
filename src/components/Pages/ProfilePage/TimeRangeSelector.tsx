import { ToggleGroup, ToggleGroupItem } from '@/components/ui/ToggleGroup'
import { useIntl } from '@/i18n'
import { useProfilePageContext } from './contexts/ProfilePageContext'
import { defineMessage, type MessageDescriptor } from 'react-intl'

const presets: Array<{ label: MessageDescriptor; monthDuration: number }> = [
  {
    label: defineMessage({ id: 'profilePage.timeRange.oneMonth', defaultMessage: '1m' }),
    monthDuration: 1,
  },
  {
    label: defineMessage({ id: 'profilePage.timeRange.threeMonths', defaultMessage: '3m' }),
    monthDuration: 3,
  },
  {
    label: defineMessage({ id: 'profilePage.timeRange.sixMonths', defaultMessage: '6m' }),
    monthDuration: 6,
  },
  {
    label: defineMessage({ id: 'profilePage.timeRange.nineMonths', defaultMessage: '9m' }),
    monthDuration: 9,
  },
  {
    label: defineMessage({ id: 'profilePage.timeRange.twelveMonths', defaultMessage: '12m' }),
    monthDuration: 12,
  },
  {
    label: defineMessage({ id: 'profilePage.timeRange.all', defaultMessage: 'All' }),
    monthDuration: -1,
  },
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
          {t(preset.label)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
