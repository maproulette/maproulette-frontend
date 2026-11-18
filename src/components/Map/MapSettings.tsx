import { type ReactNode, useId } from 'react'
import { KbdBinding } from '@/components/ui/Kbd'
import { Label } from '@/components/ui/Label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Switch } from '@/components/ui/Switch'
import type { ShortcutBinding } from '@/lib/keyboardShortcuts'

export const MapSettingsSection = ({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) => (
  <section className="space-y-3 not-first:border-line not-first:border-t p-3">
    {title && (
      <h3 className="font-medium text-fg-muted text-xs uppercase tracking-wide">{title}</h3>
    )}
    {children}
  </section>
)

interface SettingRowProps {
  id: string
  label: string
  binding?: ShortcutBinding
  control: ReactNode
}

const SettingRow = ({ id, label, binding, control }: SettingRowProps) => (
  <div className="flex items-center gap-2">
    {control}
    <Label htmlFor={id} className="flex-1 cursor-pointer font-normal">
      {label}
    </Label>
    {binding && <KbdBinding binding={binding} />}
  </div>
)

interface MapSettingSwitchProps {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  binding?: ShortcutBinding
}

export const MapSettingSwitch = ({
  label,
  checked,
  onCheckedChange,
  disabled,
  binding,
}: MapSettingSwitchProps) => {
  const id = useId()
  return (
    <SettingRow
      id={id}
      label={label}
      binding={binding}
      control={
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      }
    />
  )
}

interface MapSettingOption<T extends string> {
  value: T
  label: string
  binding?: ShortcutBinding
}

interface MapSettingRadioGroupProps<T extends string> {
  label: string
  value: T
  onValueChange: (value: T) => void
  options: MapSettingOption<T>[]
  disabled?: boolean
}

export const MapSettingRadioGroup = <T extends string>({
  label,
  value,
  onValueChange,
  options,
  disabled,
}: MapSettingRadioGroupProps<T>) => {
  const id = useId()
  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      disabled={disabled}
      className="gap-3"
    >
      {options.map((option) => (
        <SettingRow
          key={option.value}
          id={`${id}-${option.value}`}
          label={option.label}
          binding={option.binding}
          control={<RadioGroupItem id={`${id}-${option.value}`} value={option.value} />}
        />
      ))}
    </RadioGroup>
  )
}
