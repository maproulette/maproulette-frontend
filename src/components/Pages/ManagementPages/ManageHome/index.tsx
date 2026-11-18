import { Link } from '@tanstack/react-router'
import { CheckSquare, FolderKanban, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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
        <Card className="stretched-link-container transition-colors hover:border-line-strong">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <FolderKanban className="h-6 w-6 text-link" />
            </div>
            <CardTitle>
              <Link to="/manage/projects" className="stretched-link">
                {t({ id: 'common.projects', defaultMessage: 'Projects' })}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <span>{t({ id: 'common.viewProjects', defaultMessage: 'View Projects' })}</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="stretched-link-container transition-colors hover:border-line-strong">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <ListChecks className="h-6 w-6 text-link" />
            </div>
            <CardTitle>
              <Link to="/manage/challenges" className="stretched-link">
                {t({ id: 'common.challenges', defaultMessage: 'Challenges' })}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <span>{t({ id: 'common.viewChallenges', defaultMessage: 'View Challenges' })}</span>
            </Button>
          </CardContent>
        </Card>

        {showTasksCard && (
          <Card className="stretched-link-container transition-colors hover:border-line-strong">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <CheckSquare className="h-6 w-6 text-link" />
              </div>
              <CardTitle>
                <Link to="/manage/tasks" className="stretched-link">
                  {t({ id: 'common.tasks', defaultMessage: 'Tasks' })}
                </Link>
              </CardTitle>
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
