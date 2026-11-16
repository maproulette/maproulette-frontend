import { useParams } from '@tanstack/react-router'
import { MoveChallengeProvider } from '@/contexts/MoveChallengeContext'
import { ManageProjectDetailContent } from './ManageProjectDetailContent'
import { ManageProjectDetailProvider } from './ManageProjectDetailContext'

export const ManageProjectDetail = () => {
  const { projectId } = useParams({ from: '/_app/manage/project/$projectId/' })
  return (
    <ManageProjectDetailProvider>
      <MoveChallengeProvider currentProjectId={Number(projectId)}>
        <ManageProjectDetailContent />
      </MoveChallengeProvider>
    </ManageProjectDetailProvider>
  )
}
