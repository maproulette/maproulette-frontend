import { Link } from '@tanstack/react-router'
import { BookOpen, CircleUser, LayoutDashboard, LogOut, Shield, SwatchBook } from 'lucide-react'
import { api } from '@/api'
import { ThemeSwitcher } from '@/components/AppLayout/Header/ThemeSwitcher'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { docsUrl } from '@/lib/docs'
import { isSuperUser } from '@/lib/SuperAdminGuard'
import { initials } from '@/lib/utils'
import { frontendVersion } from '@/lib/version'
import type { User } from '@/types/User'

export const DropdownMenuUser = ({ user }: { user: User }) => {
  const { logout } = useAuthContext()
  const { t } = useIntl()
  const { data: serviceInfo, isError: serviceInfoError } = api.service.info()
  const backendVersion = serviceInfoError ? 'unknown' : (serviceInfo?.compiletime.version ?? null)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex cursor-pointer">
        <Avatar className="size-8 md:size-9">
          <AvatarImage src={user.osmProfile.avatarURL} alt={user.osmProfile.displayName} />
          <AvatarFallback>{initials(user.osmProfile.displayName)}</AvatarFallback>
        </Avatar>
        <span className="sr-only">
          {t('appLayout.header.userMenu.triggerSrOnly', undefined, 'User menu')}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={'w-56'} sideOffset={10} alignOffset={-10} align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <Avatar className="size-10">
              <AvatarImage src={user.osmProfile.avatarURL} alt={user.osmProfile.displayName} />
              <AvatarFallback>{initials(user.osmProfile.displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <span className="font-medium">{user.osmProfile.displayName}</span>
              <br />
              <Link to="/profile">
                <span className="text-xs text-zinc-500 hover:text-zinc-400 dark:text-slate-500 dark:hover:text-slate-400">
                  {t(
                    'appLayout.header.userMenu.viewPublicProfile',
                    undefined,
                    'View public profile'
                  )}
                </span>
              </Link>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <CircleUser className="size-4" aria-hidden="true" />{' '}
            {t('appLayout.header.userMenu.accountSettings', undefined, 'Account Settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/manage">
            <LayoutDashboard className="size-4" aria-hidden="true" />{' '}
            {t('common.manage', undefined, 'Manage')}
          </Link>
        </DropdownMenuItem>
        {isSuperUser(user) && (
          <DropdownMenuItem asChild>
            <Link to="/super-admin">
              <Shield className="size-4" aria-hidden="true" />{' '}
              {t('appLayout.header.userMenu.superAdmin', undefined, 'Super Admin')}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <a href={docsUrl()} target="_blank" rel="noreferrer">
            <BookOpen className="size-4" aria-hidden="true" />{' '}
            {t('appLayout.header.userMenu.documentation', undefined, 'Documentation')}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout}>
          <LogOut className="size-4" aria-hidden="true" />{' '}
          {t('appLayout.header.userMenu.signOut', undefined, 'Sign out')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          onSelect={(e) => {
            e.preventDefault()
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex gap-2">
              <SwatchBook className="size-4" aria-hidden="true" />{' '}
              {t('appLayout.header.userMenu.theme', undefined, 'Theme')}
            </span>
            <ThemeSwitcher />
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 px-2 py-1.5 text-[10px] text-zinc-400 leading-tight dark:text-slate-500">
          <dt>{t('appLayout.header.userMenu.frontend', undefined, 'Frontend')}</dt>
          <dd>
            <a
              href={`https://github.com/maproulette/maproulette3/releases/tag/v${frontendVersion}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 hover:underline dark:hover:text-slate-400"
            >
              v{frontendVersion}
            </a>
          </dd>
          <dt>{t('appLayout.header.userMenu.backend', undefined, 'Backend')}</dt>
          <dd>
            {backendVersion && backendVersion !== 'unknown' ? (
              <a
                href={`https://github.com/maproulette/maproulette-backend/releases/tag/v${backendVersion}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-300 hover:underline dark:hover:text-slate-400"
              >
                v{backendVersion}
              </a>
            ) : (
              <span className="opacity-60">—</span>
            )}
          </dd>
        </dl>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
