import { Link } from '@tanstack/react-router'
import {
  BarChart3,
  Database,
  Flag,
  FolderKanban,
  ImageIcon,
  ListChecks,
  Puzzle,
  Settings,
  Shield,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useIntl } from '@/i18n'

export const SuperAdminHome = () => {
  const { t } = useIntl()
  return (
    <div className="mx-auto px-4">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
          <h1 className="font-bold text-2xl text-zinc-900 tracking-tight dark:text-zinc-50">
            {t('superAdminHome.title', undefined, 'Super Admin Dashboard')}
          </h1>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t(
            'superAdminHome.subtitle',
            undefined,
            'Manage all aspects of the MapRoulette platform.'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Users */}
        <Link to="/super-admin/users">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>{t('superAdminHome.cards.users.title', undefined, 'Users')}</CardTitle>
              <CardDescription>
                {t(
                  'superAdminHome.cards.users.description',
                  undefined,
                  'Manage all platform users and permissions'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                {t('superAdminHome.cards.users.button', undefined, 'View Users')}
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Projects */}
        <Link to="/super-admin/projects">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <FolderKanban className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>{t('common.projects', undefined, 'Projects')}</CardTitle>
              <CardDescription>
                {t(
                  'common.viewManageProjectsSubtitle',
                  undefined,
                  'View and manage all projects across the platform'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                {t('common.viewProjects', undefined, 'View Projects')}
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Challenges */}
        <Link to="/super-admin/challenges">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <ListChecks className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>{t('common.challenges', undefined, 'Challenges')}</CardTitle>
              <CardDescription>
                {t(
                  'superAdminHome.cards.challenges.description',
                  undefined,
                  'Browse and manage all challenges'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                {t('common.viewChallenges', undefined, 'View Challenges')}
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Challenge reports */}
        <Link to="/super-admin/challenge-reports">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                <Flag className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>
                {t('superAdminHome.cards.challengeReports.title', undefined, 'Challenge Reports')}
              </CardTitle>
              <CardDescription>
                {t(
                  'superAdminHome.cards.challengeReports.description',
                  undefined,
                  'Triage reports that a challenge is causing incorrect edits'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                {t(
                  'superAdminHome.cards.challengeReports.button',
                  undefined,
                  'View Challenge Reports'
                )}
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Team challenge images */}
        <Link to="/super-admin/team-images">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900">
                <ImageIcon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <CardTitle>
                {t('superAdminHome.cards.teamImages.title', undefined, 'Team Images')}
              </CardTitle>
              <CardDescription>
                {t(
                  'superAdminHome.cards.teamImages.description',
                  undefined,
                  'Review challenge images teams have requested'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                {t('superAdminHome.cards.teamImages.button', undefined, 'Review Images')}
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Plugins */}
        <Link to="/super-admin/plugins">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                <Puzzle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>{t('superAdminHome.cards.plugins.title', undefined, 'Plugins')}</CardTitle>
              <CardDescription>
                {t(
                  'superAdminHome.cards.plugins.description',
                  undefined,
                  'Manage plugins and integrations'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                {t('superAdminHome.cards.plugins.button', undefined, 'View Plugins')}
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Analytics */}
        <Link to="/super-admin/analytics">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
                <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle>
                {t('superAdminHome.cards.analytics.title', undefined, 'Analytics')}
              </CardTitle>
              <CardDescription>
                {t(
                  'superAdminHome.cards.analytics.description',
                  undefined,
                  'View platform-wide analytics and metrics'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                {t('superAdminHome.cards.analytics.button', undefined, 'View Analytics')}
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Database */}
        <Card className="opacity-50">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900">
              <Database className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <CardTitle>{t('superAdminHome.cards.database.title', undefined, 'Database')}</CardTitle>
            <CardDescription>
              {t(
                'superAdminHome.cards.database.description',
                undefined,
                'Database management and maintenance'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              {t('superAdminHome.cards.database.button', undefined, 'Coming Soon')}
            </Button>
          </CardContent>
        </Card>

        {/* Settings */}
        <Link to="/super-admin/settings">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-slate-800">
                <Settings className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
              </div>
              <CardTitle>
                {t('superAdminHome.cards.settings.title', undefined, 'Settings')}
              </CardTitle>
              <CardDescription>
                {t(
                  'superAdminHome.cards.settings.description',
                  undefined,
                  'Platform settings and configuration'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                {t('superAdminHome.cards.settings.button', undefined, 'View Settings')}
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
