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
            {t({ id: 'superAdminHome.title', defaultMessage: 'Super Admin Dashboard' })}
          </h1>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t({
            id: 'superAdminHome.subtitle',
            defaultMessage: 'Manage all aspects of the MapRoulette platform.',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Users */}
        <Card className="stretched-link-container transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>
              <Link to="/super-admin/users" className="stretched-link">
                {t({ id: 'common.users', defaultMessage: 'Users' })}
              </Link>
            </CardTitle>
            <CardDescription>
              {t({
                id: 'superAdminHome.cards.users.description',
                defaultMessage: 'Manage all platform users and permissions',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <span>
                {t({ id: 'superAdminHome.cards.users.button', defaultMessage: 'View Users' })}
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card className="stretched-link-container transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
              <FolderKanban className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>
              <Link to="/super-admin/projects" className="stretched-link">
                {t({ id: 'common.projects', defaultMessage: 'Projects' })}
              </Link>
            </CardTitle>
            <CardDescription>
              {t({
                id: 'common.viewManageProjectsSubtitle',
                defaultMessage: 'View and manage all projects across the platform',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <span>{t({ id: 'common.viewProjects', defaultMessage: 'View Projects' })}</span>
            </Button>
          </CardContent>
        </Card>

        {/* Challenges */}
        <Card className="stretched-link-container transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
              <ListChecks className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle>
              <Link to="/super-admin/challenges" className="stretched-link">
                {t({ id: 'common.challenges', defaultMessage: 'Challenges' })}
              </Link>
            </CardTitle>
            <CardDescription>
              {t({
                id: 'superAdminHome.cards.challenges.description',
                defaultMessage: 'Browse and manage all challenges',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <span>{t({ id: 'common.viewChallenges', defaultMessage: 'View Challenges' })}</span>
            </Button>
          </CardContent>
        </Card>

        {/* Challenge reports */}
        <Card className="stretched-link-container transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
              <Flag className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>
              <Link to="/super-admin/challenge-reports" className="stretched-link">
                {t({
                  id: 'superAdminHome.cards.challengeReports.title',
                  defaultMessage: 'Challenge Reports',
                })}
              </Link>
            </CardTitle>
            <CardDescription>
              {t({
                id: 'superAdminHome.cards.challengeReports.description',
                defaultMessage: 'Triage reports that a challenge is causing incorrect edits',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <span>
                {t({
                  id: 'superAdminHome.cards.challengeReports.button',
                  defaultMessage: 'View Challenge Reports',
                })}
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Team challenge images */}
        <Card className="stretched-link-container transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900">
              <ImageIcon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <CardTitle>
              <Link to="/super-admin/team-images" className="stretched-link">
                {t({ id: 'superAdminHome.cards.teamImages.title', defaultMessage: 'Team Images' })}
              </Link>
            </CardTitle>
            <CardDescription>
              {t({
                id: 'superAdminHome.cards.teamImages.description',
                defaultMessage: 'Review challenge images teams have requested',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <span>
                {t({
                  id: 'superAdminHome.cards.teamImages.button',
                  defaultMessage: 'Review Images',
                })}
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Plugins */}
        <Card className="stretched-link-container transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
              <Puzzle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle>
              <Link to="/super-admin/plugins" className="stretched-link">
                {t({ id: 'common.plugins', defaultMessage: 'Plugins' })}
              </Link>
            </CardTitle>
            <CardDescription>
              {t({
                id: 'superAdminHome.cards.plugins.description',
                defaultMessage: 'Manage plugins and integrations',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <span>
                {t({ id: 'superAdminHome.cards.plugins.button', defaultMessage: 'View Plugins' })}
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card className="stretched-link-container transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
              <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle>
              <Link to="/super-admin/analytics" className="stretched-link">
                {t({ id: 'superAdminHome.cards.analytics.title', defaultMessage: 'Analytics' })}
              </Link>
            </CardTitle>
            <CardDescription>
              {t({
                id: 'superAdminHome.cards.analytics.description',
                defaultMessage: 'View platform-wide analytics and metrics',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <span>
                {t({
                  id: 'superAdminHome.cards.analytics.button',
                  defaultMessage: 'View Analytics',
                })}
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Database */}
        <Card className="opacity-50">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900">
              <Database className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <CardTitle>
              {t({ id: 'superAdminHome.cards.database.title', defaultMessage: 'Database' })}
            </CardTitle>
            <CardDescription>
              {t({
                id: 'superAdminHome.cards.database.description',
                defaultMessage: 'Database management and maintenance',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              {t({ id: 'common.comingSoon', defaultMessage: 'Coming Soon' })}
            </Button>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="stretched-link-container transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-slate-800">
              <Settings className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            </div>
            <CardTitle>
              <Link to="/super-admin/settings" className="stretched-link">
                {t({ id: 'superAdminHome.cards.settings.title', defaultMessage: 'Settings' })}
              </Link>
            </CardTitle>
            <CardDescription>
              {t({
                id: 'superAdminHome.cards.settings.description',
                defaultMessage: 'Platform settings and configuration',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <span>
                {t({ id: 'superAdminHome.cards.settings.button', defaultMessage: 'View Settings' })}
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
