import { Link } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { useChromeNavigation } from '@/contexts/ChromeContext'
import { useIntl } from '@/i18n'

export const DesktopNav = () => {
  const { navigationItems: allNavigationItems } = useChromeNavigation()
  const { t } = useIntl()

  return (
    <nav
      aria-label={t('common.primary', undefined, 'Primary')}
      className="hidden text-sm lg:flex lg:gap-6"
    >
      {allNavigationItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          target={item.openInNewTab ? '_blank' : ''}
          className="link-nav flex items-center gap-1.5"
        >
          {item.icon && <span className="inline-flex">{item.icon}</span>}
          {item.label}
          {item.openInNewTab && (
            <ExternalLink
              className="size-3.5 text-current"
              aria-label={t(
                'appLayout.header.nav.openInNewTab',
                { label: item.label },
                'Open {label} in a new tab'
              )}
            />
          )}
        </Link>
      ))}
    </nav>
  )
}
