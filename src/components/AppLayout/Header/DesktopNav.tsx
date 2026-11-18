import { Link } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { useChromeNavigation } from '@/contexts/ChromeContext'
import { useIntl } from '@/i18n'

export const DesktopNav = () => {
  const { navigationItems: allNavigationItems } = useChromeNavigation()
  const { t } = useIntl()

  return (
    <nav
      aria-label={t({ id: 'common.primary', defaultMessage: 'Primary' })}
      className="hidden text-sm lg:flex lg:gap-6"
    >
      {allNavigationItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          target={item.openInNewTab ? '_blank' : ''}
          className="link-nav after:-bottom-1.5 after:bg-(image:--accent-gradient) relative flex items-center gap-1.5 rounded-sm after:absolute after:inset-x-0 after:h-0.5 after:rounded-full after:opacity-0 after:transition-opacity dark:after:hidden [&.active]:after:opacity-100"
        >
          {item.icon && <span className="inline-flex">{item.icon}</span>}
          {item.label}
          {item.openInNewTab && (
            <ExternalLink
              className="size-3.5 text-current"
              aria-label={t(
                {
                  id: 'appLayout.header.nav.openInNewTab',
                  defaultMessage: 'Open {label} in a new tab',
                },
                { label: item.label }
              )}
            />
          )}
        </Link>
      ))}
    </nav>
  )
}
