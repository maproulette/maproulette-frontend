import { useNavigate, useParams } from '@tanstack/react-router'
import { api } from '@/api'
import {
  ProjectForm,
  type ProjectFormValues,
} from '@/components/Pages/ManagementPages/ManageProjectNew/ProjectForm'
import { FormCard, ManageFormLayout } from '@/components/shared/ManageFormLayout'
import { useIntl } from '@/i18n'

export const ManageProjectEdit = () => {
  const { t } = useIntl()
  const { projectId } = useParams({ from: '/_app/manage/project/$projectId/edit' })
  const navigate = useNavigate()

  const { data: projectData, isLoading } = api.project.getProject(Number(projectId))
  const updateProjectMutation = api.project.useUpdateProject()

  const handleSubmit = async (values: ProjectFormValues) => {
    await updateProjectMutation.mutateAsync({
      projectId: Number(projectId),
      updates: {
        name: values.name,
        displayName: values.displayName,
        description: values.description || undefined,
        enabled: values.enabled,
        featured: values.featured,
        ownerTeamId: values.ownerTeamId,
      },
    })

    navigate({ to: '/manage/project/$projectId', params: { projectId } })
  }

  const handleCancel = () => {
    navigate({ to: '/manage/project/$projectId', params: { projectId } })
  }

  return (
    <ManageFormLayout>
      <FormCard
        title={t('manageProjectEdit.pageTitle', undefined, 'Project Details')}
        description={t(
          'manageProjectEdit.pageDescription',
          undefined,
          'Modify the information below to update your project'
        )}
        isLoading={isLoading}
      >
        <ProjectForm project={projectData} onSubmit={handleSubmit} onCancel={handleCancel} />
      </FormCard>
    </ManageFormLayout>
  )
}
