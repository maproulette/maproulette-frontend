import { createContext, type ReactNode, useMemo } from 'react'
import { api } from '@/api'
import type { Project } from '@/types/Project'
import { useChallengeContext } from './ChallengeContext'

type ProjectContextType = {
  project: Project | undefined
  projectLoading: boolean
  projectError: Error | null
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const { challenge } = useChallengeContext()
  const { data, isLoading, error } = api.project.getProject(challenge?.parent)

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value: ProjectContextType = useMemo(
    () => ({
      project: data,
      projectLoading: isLoading,
      projectError: error,
    }),
    [data, isLoading, error]
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}
