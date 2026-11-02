import { Link } from '@tanstack/react-router'
import { ExternalLink, MenuIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useChromeNavigation } from '@/contexts/ChromeContext'
import { useIntl } from '@/i18n'

export const MobileNav = () => {
  const { navigationItems: allNavigationItems } = useChromeNavigation()
  const { t } = useIntl()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hover:text-lime-600 lg:hidden"
          aria-label={t({ id: 'appLayout.header.nav.mobile', defaultMessage: 'Mobile navigation' })}
        >
          <MenuIcon className="size-6" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        {allNavigationItems.map((item) => (
          <DropdownMenuItem key={item.to} asChild>
            <Link
              to={item.to}
              target={item.openInNewTab ? '_blank' : ''}
              className="flex w-full items-center gap-1.5"
            >
              {item.icon && <span className="inline-flex">{item.icon}</span>}
              {item.label}
              {item.openInNewTab && (
                <ExternalLink
                  className="size-3.5"
                  aria-label={t({ id: 'appLayout.header.nav.openInNewTab', defaultMessage: 'Open {label} in a new tab' }, { label: item.label }
                  )}
                />
              )}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
