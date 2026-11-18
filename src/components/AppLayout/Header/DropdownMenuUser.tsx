import { Link } from '@tanstack/react-router'
import { BookOpen, CircleUser, LayoutDashboard, LogOut, Shield, SwatchBook } from 'lucide-react'
import { ThemeSwitcher } from '@/components/AppLayout/Header/ThemeSwitcher'
import { OsmUserLink } from '@/components/shared/OsmUserLink'
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
import { docsUrl } from '@/lib/documentationLinks'
import { isSuperUser } from '@/lib/SuperAdminGuard'
import { initials } from '@/lib/utils'
import type { User } from '@/types/User'

export const DropdownMenuUser = ({ user }: { user: User }) => {
  const { logout } = useAuthContext()
  const { t } = useIntl()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex cursor-pointer rounded-full">
        <Avatar className="size-8 md:size-9">
          <AvatarImage src={user.osmProfile.avatarURL} alt={user.osmProfile.displayName} />
          <AvatarFallback>{initials(user.osmProfile.displayName)}</AvatarFallback>
        </Avatar>
        <span className="sr-only">
          {t({ id: 'appLayout.header.userMenu.triggerSrOnly', defaultMessage: 'User menu' })}
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
              <OsmUserLink
                username={user.osmProfile.displayName}
                className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {t({
                  id: 'appLayout.header.userMenu.osmProfile',
                  defaultMessage: 'OpenStreetMap profile',
                })}
              </OsmUserLink>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <CircleUser className="size-4" aria-hidden="true" />{' '}
            {t({
              id: 'appLayout.header.userMenu.accountSettings',
              defaultMessage: 'Account Settings',
            })}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/manage">
            <LayoutDashboard className="size-4" aria-hidden="true" />{' '}
            {t({ id: 'common.manage', defaultMessage: 'Manage' })}
          </Link>
        </DropdownMenuItem>
        {isSuperUser(user) && (
          <DropdownMenuItem asChild>
            <Link to="/super-admin">
              <Shield className="size-4" aria-hidden="true" />{' '}
              {t({ id: 'appLayout.header.userMenu.superAdmin', defaultMessage: 'Super Admin' })}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <a href={docsUrl()} target="_blank" rel="noreferrer">
            <BookOpen className="size-4" aria-hidden="true" />{' '}
            {t({ id: 'appLayout.header.userMenu.documentation', defaultMessage: 'Documentation' })}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout}>
          <LogOut className="size-4" aria-hidden="true" />{' '}
          {t({ id: 'appLayout.header.userMenu.signOut', defaultMessage: 'Sign out' })}
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
              {t({ id: 'appLayout.header.userMenu.theme', defaultMessage: 'Theme' })}
            </span>
            <ThemeSwitcher />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
