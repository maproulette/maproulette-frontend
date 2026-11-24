import { ExternalLink, Languages } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateUserSettings } from '@/api/user'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { type Locale, localeOptions, translateUrl, useIntl } from '@/i18n'
import type { User } from '@/types/User'

export const DropdownMenuLanguage = ({ user }: { user?: User }) => {
  const { t, locale, setLocale } = useIntl()
  const updateSettings = useUpdateUserSettings()

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
        className="max-h-(--radix-dropdown-menu-content-available-height) w-64 overflow-y-auto"
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
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={translateUrl} target="_blank" rel="noopener noreferrer">
            {t({
              id: 'appLayout.header.languageMenu.translate',
              defaultMessage: 'Translate into your language',
            })}
            <ExternalLink className="ml-auto size-4" aria-hidden="true" />
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
