import { useLoaderData } from '@tanstack/react-router'
import { createContext, type ReactNode, useContext, useMemo } from 'react'
import type { Project } from '@/types/Project'

type BrowsedProjectContextType = {
  project: Project
}

const BrowsedProjectContext = createContext<BrowsedProjectContextType | undefined>(undefined)

export const BrowsedProjectProvider = ({ children }: { children: ReactNode }) => {
  const { project } = useLoaderData({ from: '/_app/project/$projectId/' })

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo<BrowsedProjectContextType>(() => ({ project }), [project])

  return <BrowsedProjectContext.Provider value={value}>{children}</BrowsedProjectContext.Provider>
}

export const useBrowsedProjectContext = () => {
  const context = useContext(BrowsedProjectContext)

  if (context === undefined) {
    throw new Error('useBrowsedProject must be used within a BrowsedProjectProvider')
  }

  return context
}
