import { BrowsedProjectProvider } from '@/components/Pages/BrowsedProjectPage/contexts/BrowsedProjectContext'
import { BrowsedProjectPageContent } from './BrowsedProjectPageContent'

export const BrowsedProjectPage = () => {
  return (
    <BrowsedProjectProvider>
      <BrowsedProjectPageContent />
    </BrowsedProjectProvider>
  )
}
