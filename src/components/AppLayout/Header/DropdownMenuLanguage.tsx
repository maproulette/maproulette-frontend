import { Languages } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { type Locale, localeOptions, useIntl } from '@/i18n'
import type { User } from '@/types/User'

export const DropdownMenuLanguage = ({ user }: { user?: User }) => {
  const { t, locale, setLocale } = useIntl()
  const updateSettings = api.user.useUpdateUserSettings()

  const changeLocale = (next: Locale) => {
    if (!user) {
      setLocale(next)
      return
    }
    updateSettings.mutate(
      { userId: user.id, settings: { ...user.settings, locale: next } },
      {
        onError: () =>
          toast.error(
            t({
              id: 'settings.account.saveError',
              defaultMessage: 'Failed to update user settings',
            })
          ),
      }
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex cursor-pointer rounded-sm hover:text-link"
        aria-label={t({ id: 'settings.general.languageLabel', defaultMessage: 'Language' })}
      >
        <Languages className="size-5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="max-h-(--radix-dropdown-menu-content-available-height) w-56 overflow-y-auto"
        sideOffset={10}
        align="end"
      >
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => changeLocale(value as Locale)}
        >
          {localeOptions.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value} lang={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
