import { Link } from '@tanstack/react-router'
import { ExternalLink, MenuIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useNavigationContext } from '@/contexts/NavigationContext'
import { useIntl } from '@/i18n'

export const MobileNav = () => {
  const { allNavigationItems } = useNavigationContext()
  const { t } = useIntl()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hover:text-lime-600 lg:hidden"
          aria-label={t('appLayout.header.nav.mobile', undefined, 'Mobile navigation')}
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
                  aria-label={t(
                    'appLayout.header.nav.openInNewTab',
                    { label: item.label },
                    'Open {label} in a new tab'
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
