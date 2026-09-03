import { Link, useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useIntl } from '@/i18n'
import { SuperAdminGuard } from '@/lib/SuperAdminGuard'

/**
 * Simple "Open task by ID" page. Linked from Manage home Tasks card.
 * Enter a task ID to view or edit the task in the manage flow.
 */
export const ManageTasksOpen = () => {
  const { t } = useIntl()
  const navigate = useNavigate()
  const taskIdInputId = useId()
  const [taskIdInput, setTaskIdInput] = useState('')

  const taskId = taskIdInput.trim() ? Number(taskIdInput.trim()) : null
  const isValidId = taskId != null && !Number.isNaN(taskId) && taskId > 0

  const handleView = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidId) return
    navigate({ to: '/tasks/$taskId', params: { taskId: String(taskId) } })
  }

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidId) return
    navigate({ to: '/manage/task/$taskId/edit', params: { taskId: String(taskId) } })
  }

  return (
    <SuperAdminGuard>
      <div className="mx-auto h-full max-w-xl overflow-auto px-4">
        <div className="mb-6">
          <h1 className="mb-2 font-bold text-base text-zinc-900 dark:text-zinc-50">
            {t('common.tasks', undefined, 'Tasks')}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t(
              'manageTasksOpen.description',
              undefined,
              'Open a task by ID to view details or edit it (name, instructions, status, etc.).'
            )}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t('common.openTaskById', undefined, 'Open task by ID')}
            </CardTitle>
            <CardDescription>
              {t(
                'manageTasksOpen.cardDescription',
                undefined,
                'Enter a task ID below. You can find task IDs when working on a task (URL or header) or from your saved/locked tasks on the dashboard.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleView}>
              <div className="space-y-2">
                <Label htmlFor={taskIdInputId}>
                  {t('manageTasksOpen.taskIdLabel', undefined, 'Task ID')}
                </Label>
                <Input
                  id={taskIdInputId}
                  type="number"
                  min={1}
                  placeholder={t('manageTasksOpen.taskIdPlaceholder', undefined, 'e.g. 12345')}
                  value={taskIdInput}
                  onChange={(e) => setTaskIdInput(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={!isValidId}>
                  {t('manageTasksOpen.viewTask', undefined, 'View task')}
                </Button>
                <Button type="button" variant="outline" disabled={!isValidId} onClick={handleEdit}>
                  {t('common.editTask', undefined, 'Edit task')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          {t('manageTasksOpen.orGoTo', undefined, 'Or go to')}{' '}
          <Link to="/manage/projects" className="text-blue-600 hover:underline dark:text-blue-400">
            {t('common.projects', undefined, 'Projects')}
          </Link>{' '}
          {t('manageTasksOpen.or', undefined, 'or')}{' '}
          <Link
            to="/manage/challenges"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            {t('common.challenges', undefined, 'Challenges')}
          </Link>{' '}
          {t(
            'manageTasksOpen.findChallengeHint',
            undefined,
            'to find a challenge, then browse it to open a task and get its ID from the URL.'
          )}
        </p>
      </div>
    </SuperAdminGuard>
  )
}
