import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'

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
  const [view, setView] = useState<PanelView>('task')

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
