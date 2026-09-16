import { useNavigate } from '@tanstack/react-router'
import { api } from '@/api'
import {
  ProjectForm,
  type ProjectFormValues,
} from '@/components/Pages/ManagementPages/ManageProjectNew/ProjectForm'
import { FormCard, ManageFormLayout } from '@/components/shared/ManageFormLayout'
import { useIntl } from '@/i18n'

export const ManageProjectNew = () => {
  const { t } = useIntl()
  const navigate = useNavigate()
  const createProjectMutation = api.project.useCreateProject()

  const handleSubmit = async (values: ProjectFormValues) => {
    const newProject = await createProjectMutation.mutateAsync({
      name: values.name,
      displayName: values.displayName,
      description: values.description || undefined,
      enabled: values.enabled,
      featured: values.featured,
      ownerTeamId: values.ownerTeamId,
    })

    if (newProject.id) {
      navigate({ to: '/manage/project/$projectId', params: { projectId: String(newProject.id) } })
    } else {
      navigate({ to: '/manage/projects' })
    }
  }

  const handleCancel = () => {
    navigate({ to: '/manage/projects' })
  }

  return (
    <ManageFormLayout>
      <FormCard
        title={t('common.createNewProject', undefined, 'Create New Project')}
        description={t(
          'manageProjectNew.pageDescription',
          undefined,
          'Fill in the information below to create your new project'
        )}
      >
        <ProjectForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </FormCard>
    </ManageFormLayout>
  )
}
