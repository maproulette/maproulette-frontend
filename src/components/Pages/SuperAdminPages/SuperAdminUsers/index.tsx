import { Calendar, ChevronLeft, ChevronRight, Mail, Users } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import { OsmUserLink } from '@/components/shared/OsmUserLink'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
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
  const { t, locale } = useIntl()
  const [page, setPage] = useState(0)
  const limit = 50

  const { data: users, isLoading } = api.user.getAllUsers({ limit, page })

  const totalUsers = users?.length ?? 0
  const hasNextPage = totalUsers === limit
  const hasPreviousPage = page > 0

  return (
    <div className="mx-auto px-4">
      <div className="mb-6 flex items-center gap-2">
        <Users className="h-8 w-8 text-link" />
        <h1 className="font-bold text-base text-fg">
          {t({ id: 'superAdminUsers.title', defaultMessage: 'User Management' })}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {t({ id: 'superAdminUsers.table.title', defaultMessage: 'All Users' })}
              </CardTitle>
              <CardDescription>
                {t(
                  {
                    id: 'superAdminUsers.table.subtitle',
                    defaultMessage: 'Page {page, number}',
                  },
                  { page: page + 1 }
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
                {t({ id: 'superAdminUsers.table.previous', defaultMessage: 'Previous' })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNextPage || isLoading}
              >
                {t({ id: 'superAdminUsers.table.next', defaultMessage: 'Next' })}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-fg-muted">
                {t({ id: 'superAdminUsers.table.loading', defaultMessage: 'Loading users...' })}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t({ id: 'superAdminUsers.table.columns.user', defaultMessage: 'User' })}
                  </TableHead>
                  <TableHead>
                    {t({ id: 'superAdminUsers.table.columns.osmId', defaultMessage: 'OSM ID' })}
                  </TableHead>
                  <TableHead>{t({ id: 'common.email', defaultMessage: 'Email' })}</TableHead>
                  <TableHead>{t({ id: 'common.role', defaultMessage: 'Role' })}</TableHead>
                  <TableHead>
                    {t({ id: 'superAdminUsers.table.columns.score', defaultMessage: 'Score' })}
                  </TableHead>
                  <TableHead>{t({ id: 'common.joined', defaultMessage: 'Joined' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => {
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
                            <AvatarFallback>{initials(user.osmProfile.displayName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <OsmUserLink
                              username={user.osmProfile.displayName}
                              className="block text-link hover:underline"
                            />
                            <div className="text-fg-muted text-xs">ID: {user.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.osmProfile.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-fg-subtle" />
                          {user.settings?.email ||
                            t({
                              id: 'superAdminUsers.table.notAvailable',
                              defaultMessage: 'N/A',
                            })}
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
                          <Calendar className="h-4 w-4 text-fg-subtle" />
                          {user.created ? formatDate(new Date(user.created), locale) : '—'}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
