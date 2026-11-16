import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { useTaskContext } from './TaskContext'

export type PanelView = 'task' | 'challengeDescription' | 'projectDescription'

interface PanelViewContextType {
  view: PanelView
  showView: (view: PanelView) => void
}

const PanelViewContext = createContext<PanelViewContextType | undefined>(undefined)

/**
 * Which of the task panel's faces is showing. The panel is one column with room for one
 * thing at a time, so opening the challenge or project description takes it over entirely
 * rather than stacking a modal on top of the map.
 */
export const PanelViewProvider = ({ children }: { children: ReactNode }) => {
  const { task } = useTaskContext()
  const [view, setView] = useState<PanelView>('task')

  // Moving to the next task puts the panel back on that task, not on whichever
  // description the mapper had opened over it.
  useEffect(() => {
    setView('task')
  }, [task.id])

  const value = useMemo(() => ({ view, showView: setView }), [view])

  return <PanelViewContext.Provider value={value}>{children}</PanelViewContext.Provider>
}

export const usePanelViewContext = () => {
  const context = useContext(PanelViewContext)

  if (context === undefined) {
    throw new Error('usePanelViewContext must be used within a PanelViewProvider')
  }

  return context
}
