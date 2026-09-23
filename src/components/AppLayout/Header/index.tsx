import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/Button'
import { Loader } from '@/components/ui/Loader'
import { Logomark } from '@/components/ui/Logomark'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { DesktopNav } from './DesktopNav'
import { DropdownMenuNotifications } from './DropdownMenuNotifications'
import { DropdownMenuUser } from './DropdownMenuUser'
import { GlobalSearch } from './GlobalSearch'
import { MobileNav } from './MobileNav'

export const Header = () => {
  const { user, login, authLoading } = useAuthContext()
  const { t } = useIntl()

  return (
    <header className="relative z-30 flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 md:flex-nowrap md:gap-6 md:px-5 md:py-3.5 lg:gap-12">
      <Link to="/" rel="home" className="flex items-center gap-2">
        <Logomark className="size-8 md:size-9" />
        <span className="whitespace-nowrap font-medium text-xl/5">
          {window.env.VITE_APP_NAME || t('appLayout.header.appName', undefined, 'MapRoulette')}
        </span>
      </Link>
      {/* Too many items to share one row below md — the search bar wraps to
          its own full-width row underneath instead of getting squeezed. */}
      <GlobalSearch className="md:-m-3.5 order-last w-full md:order-none md:w-auto md:grow md:p-3.5" />
      <DesktopNav />
      <div className="flex items-center gap-4">
        <MobileNav />
        {user ? (
          <>
            <DropdownMenuNotifications user={user} />
            <DropdownMenuUser user={user} />
          </>
        ) : authLoading ? (
          <Loader message={t('appLayout.header.signingIn', undefined, 'signing in...')} />
        ) : (
          <Button size="lg" onClick={login} className="rounded-full">
            {t('common.signIn', undefined, 'Sign in')}
          </Button>
        )}
      </div>
    </header>
  )
}
