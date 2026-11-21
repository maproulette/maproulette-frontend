import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { projectOptions, useUpdateProject } from '@/api/project'
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

  const { data: projectData, isLoading } = useQuery(projectOptions(Number(projectId)))
  const updateProjectMutation = useUpdateProject()

  const handleSubmit = async (values: ProjectFormValues) => {
    await updateProjectMutation.mutateAsync({
      projectId: Number(projectId),
      updates: {
        name: values.name,
        displayName: values.displayName,
        description: values.description ?? '',
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
        title={t({ id: 'manageProjectEdit.pageTitle', defaultMessage: 'Project Details' })}
        isLoading={isLoading}
      >
        <ProjectForm project={projectData} onSubmit={handleSubmit} onCancel={handleCancel} />
      </FormCard>
    </ManageFormLayout>
  )
}
