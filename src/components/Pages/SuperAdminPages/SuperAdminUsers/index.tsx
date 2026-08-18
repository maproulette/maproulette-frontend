import { Calendar, ChevronLeft, ChevronRight, Mail, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import { SearchBar } from '@/components/shared/SearchBar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/Empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import { useIntl } from '@/i18n'
import { formatDate } from '@/lib/date'
import { getRoleBadgeColor, getUserRole } from '@/lib/SuperAdminGuard'
import { cn, initials } from '@/lib/utils'

export const SuperAdminUsers = () => {
  const { t } = useIntl()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const limit = 50

  const { data: users, isLoading } = api.user.getAllUsers({ limit, page })

  const { data: superUserIds } = api.user.getSuperUsers()

  const filteredUsers =
    users?.filter(
      (user) =>
        user.osmProfile.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.settings?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? []

  const totalUsers = users?.length ?? 0
  const hasNextPage = totalUsers === limit
  const hasPreviousPage = page > 0

  return (
    <div className="mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
                {t('superAdminUsers.title', undefined, 'User Management')}
              </h1>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t(
                'superAdminUsers.subtitle',
                undefined,
                'Manage all users and their permissions across the platform'
              )}
            </p>
          </div>
          <Button size="lg">
            <Users className="mr-2 h-5 w-5" />
            {t('superAdminUsers.addButton', undefined, 'Add New User')}
          </Button>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t(
            'superAdminUsers.searchPlaceholder',
            undefined,
            'Search this page by name or email...'
          )}
        />
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>
              {t('superAdminUsers.stats.usersOnPage', undefined, 'Users on Page')}
            </CardDescription>
            <CardTitle className="font-semibold text-base">{totalUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {t('superAdminUsers.stats.perPage', { limit }, 'Showing {limit} per page')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>
              {t('superAdminUsers.stats.filteredResults', undefined, 'Filtered Results')}
            </CardDescription>
            <CardTitle className="font-semibold text-base">{filteredUsers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {t('superAdminUsers.stats.basedOnSearch', undefined, 'Based on current search')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>
              {t('superAdminUsers.stats.superAdmins', undefined, 'Super Admins')}
            </CardDescription>
            <CardTitle className="font-semibold text-base">{superUserIds?.length ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {t('superAdminUsers.stats.platformWide', undefined, 'Platform-wide')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('superAdminUsers.table.title', undefined, 'All Users')}</CardTitle>
              <CardDescription>
                {t(
                  'superAdminUsers.table.subtitle',
                  { page: page + 1 },
                  'A list of all users in the system (page {page})'
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={!hasPreviousPage || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                {t('superAdminUsers.table.previous', undefined, 'Previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNextPage || isLoading}
              >
                {t('superAdminUsers.table.next', undefined, 'Next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-zinc-600 dark:text-zinc-400">
                {t('superAdminUsers.table.loading', undefined, 'Loading users...')}
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t('superAdminUsers.table.columns.user', undefined, 'User')}
                    </TableHead>
                    <TableHead>
                      {t('superAdminUsers.table.columns.osmId', undefined, 'OSM ID')}
                    </TableHead>
                    <TableHead>
                      {t('superAdminUsers.table.columns.email', undefined, 'Email')}
                    </TableHead>
                    <TableHead>
                      {t('superAdminUsers.table.columns.role', undefined, 'Role')}
                    </TableHead>
                    <TableHead>
                      {t('superAdminUsers.table.columns.score', undefined, 'Score')}
                    </TableHead>
                    <TableHead>{t('common.joined', undefined, 'Joined')}</TableHead>
                    <TableHead>{t('common.actions', undefined, 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const role = getUserRole(user)
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={user.osmProfile.avatarURL}
                                alt={user.osmProfile.displayName}
                              />
                              <AvatarFallback>
                                {initials(user.osmProfile.displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div>{user.osmProfile.displayName}</div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <a
                            href={`https://www.openstreetmap.org/user/${user.osmProfile.displayName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {user.osmProfile.id}
                          </a>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-zinc-400" />
                            {user.settings?.email ||
                              t('superAdminUsers.table.notAvailable', undefined, 'N/A')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('capitalize', getRoleBadgeColor(role))}>
                            {role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{user.score ?? 0}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-zinc-400" />
                            {user.created ? formatDate(new Date(user.created)) : '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              {t('common.view', undefined, 'View')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {filteredUsers.length === 0 && (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Search />
                    </EmptyMedia>
                    <EmptyTitle>
                      {t(
                        'superAdminUsers.empty.title',
                        undefined,
                        'No matching users on this page'
                      )}
                    </EmptyTitle>
                    <EmptyDescription>
                      {t(
                        'superAdminUsers.empty.description',
                        undefined,
                        'This search only covers the users currently loaded on this page, not all users in the system. Try the next page or a different search term.'
                      )}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
