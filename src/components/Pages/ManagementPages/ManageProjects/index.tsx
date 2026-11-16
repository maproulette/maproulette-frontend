import { ManageProjectsContent } from './ManageProjectsContent'
import { ManageProjectsProvider } from './ManageProjectsContext'

export const ManageProjects = () => {
  return (
    <ManageProjectsProvider>
      <ManageProjectsContent />
    </ManageProjectsProvider>
  )
}
