import { useNavigate, useParams } from '@tanstack/react-router'
import { api } from '@/api'
import {
  TaskForm,
  type TaskFormValues,
} from '@/components/Pages/ManagementPages/ManageTaskEdit/TaskForm'
import { FormCard, ManageFormLayout } from '@/components/shared/ManageFormLayout'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { canManageChallenge } from '@/lib/challengePermissions'
import { isSuperUser } from '@/lib/SuperAdminGuard'
import type { TaskGetResponse } from '@/types/Task'

export const ManageTaskEdit = () => {
  const { t } = useIntl()
  const { taskId } = useParams({ from: '/_app/manage/task/$taskId/edit' })
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const taskIdNum = Number(taskId)

  const { data: task, isLoading, isError } = api.task.getTask(taskIdNum)
  const challengeId =
    task && typeof task.parent === 'number' ? task.parent : (task?.parent as { id?: number })?.id
  const { data: challenge, isLoading: challengeLoading } = api.challenge.getChallenge(
    challengeId ?? 0
  )
  const updateTaskMutation = api.task.useUpdateTask()

  const canAccess =
    user &&
    (isSuperUser(user) ||
      (!!challengeId &&
        !challengeLoading &&
        challenge != null &&
        canManageChallenge(user, challenge)))
  const permissionChecked = !challengeId || !challengeLoading
  const showAccessDenied = !isLoading && task && permissionChecked && !canAccess

  const handleSubmit = async (values: TaskFormValues) => {
    if (!task) return
    const parentId =
      typeof task.parent === 'number' ? task.parent : ((task.parent as { id?: number })?.id ?? 0)
    const body: TaskGetResponse = {
      ...task,
      parent: parentId,
      name: values.name,
      instruction: values.instruction ?? null,
      geometries: JSON.parse(values.geometries),
      status: values.status,
    }
    await updateTaskMutation.mutateAsync({ taskId: taskIdNum, body })
    navigate({ to: '/tasks/$taskId', params: { taskId } })
  }

  const handleCancel = () => {
    navigate({ to: '/tasks/$taskId', params: { taskId } })
  }

  if (isError) {
    return (
      <ManageFormLayout>
        <FormCard
          title={t({ id: 'manageTaskEdit.index.loadErrorTitle', defaultMessage: 'Task not found' })}
          description={t({
            id: 'manageTaskEdit.index.loadErrorDescription',
            defaultMessage: 'This task could not be loaded. It may have been deleted.',
          })}
        />
      </ManageFormLayout>
    )
  }

  if (isLoading || !task || (task && challengeId && challengeLoading)) {
    return (
      <ManageFormLayout>
        <FormCard
          title={t({ id: 'manageTaskEdit.index.taskDetailsTitle', defaultMessage: 'Task Details' })}
          isLoading
        >
          <div className="h-40" />
        </FormCard>
      </ManageFormLayout>
    )
  }

  if (showAccessDenied) {
    return (
      <ManageFormLayout>
        <FormCard
          title={t({ id: 'common.accessDenied', defaultMessage: 'Access denied' })}
          description={t({
            id: 'manageTaskEdit.index.accessDeniedDescription',
            defaultMessage: "Only this challenge's managers can edit its tasks.",
          })}
        />
      </ManageFormLayout>
    )
  }

  return (
    <ManageFormLayout>
      <FormCard
        title={t({ id: 'manageTaskEdit.index.taskDetailsTitle', defaultMessage: 'Task Details' })}
      >
        <TaskForm task={task} onSubmit={handleSubmit} onCancel={handleCancel} />
      </FormCard>
    </ManageFormLayout>
  )
}
