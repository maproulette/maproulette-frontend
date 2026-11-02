import { Link } from '@tanstack/react-router'
import { CheckSquare, FolderKanban, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { isSuperUser } from '@/lib/SuperAdminGuard'

export const ManageHome = () => {
  const { t } = useIntl()
  const { user } = useAuthContext()
  const showTasksCard = user && isSuperUser(user)

  return (
    <div className="mx-auto h-full overflow-auto p-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="stretched-link-container transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <FolderKanban className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>
              <Link to="/manage/projects" className="stretched-link">
                {t({ id: 'common.projects', defaultMessage: 'Projects' })}
              </Link>
            </CardTitle>
            <CardDescription>
              {t({
                id: 'manageHome.projectsDescription',
                defaultMessage: 'Create and manage your MapRoulette projects',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <span>{t({ id: 'common.viewProjects', defaultMessage: 'View Projects' })}</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="stretched-link-container transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
              <ListChecks className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>
              <Link to="/manage/challenges" className="stretched-link">
                {t({ id: 'common.challenges', defaultMessage: 'Challenges' })}
              </Link>
            </CardTitle>
            <CardDescription>
              {t({
                id: 'manageHome.challengesDescription',
                defaultMessage: 'Browse and manage all your challenges',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <span>{t({ id: 'common.viewChallenges', defaultMessage: 'View Challenges' })}</span>
            </Button>
          </CardContent>
        </Card>

        {showTasksCard && (
          <Card className="stretched-link-container transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <CheckSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>
                <Link to="/manage/tasks" className="stretched-link">
                  {t({ id: 'common.tasks', defaultMessage: 'Tasks' })}
                </Link>
              </CardTitle>
              <CardDescription>
                {t({
                  id: 'manageHome.tasksDescription',
                  defaultMessage: 'Open a task by ID to view or edit it',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <span>{t({ id: 'common.openTaskById', defaultMessage: 'Open task by ID' })}</span>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
