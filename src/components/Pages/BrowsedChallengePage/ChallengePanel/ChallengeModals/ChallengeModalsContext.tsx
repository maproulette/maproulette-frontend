import { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface ChallengeModalsContextType {
  isReportModalOpen: boolean
  isReportHistoryModalOpen: boolean
  isCommentsModalOpen: boolean
  isOverpassModalOpen: boolean
  isCloneModalOpen: boolean
  isActionsModalOpen: boolean
  openReport: () => void
  openReportHistory: () => void
  openComments: () => void
  openOverpass: () => void
  openClone: () => void
  openActions: () => void
  closeReport: () => void
  closeReportHistory: () => void
  closeComments: () => void
  closeOverpass: () => void
  closeClone: () => void
  closeActions: () => void
  setReportOpen: (open: boolean) => void
  setReportHistoryOpen: (open: boolean) => void
  setCommentsOpen: (open: boolean) => void
  setOverpassOpen: (open: boolean) => void
  setCloneOpen: (open: boolean) => void
  setActionsOpen: (open: boolean) => void
}

const ChallengeModalsContext = createContext<ChallengeModalsContextType | undefined>(undefined)

export const useChallengeModals = () => {
  const context = useContext(ChallengeModalsContext)
  if (!context) {
    throw new Error('useChallengeModals must be used within ChallengeModalsProvider')
  }
  return context
}

export const ChallengeModalsProvider = ({ children }: { children: React.ReactNode }) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isReportHistoryModalOpen, setIsReportHistoryModalOpen] = useState(false)
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false)
  const [isOverpassModalOpen, setIsOverpassModalOpen] = useState(false)
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false)
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false)

  // All callbacks are memoized because they are stored in the context value.
  const openReport = useCallback(() => setIsReportModalOpen(true), [])
  const openReportHistory = useCallback(() => setIsReportHistoryModalOpen(true), [])
  const openComments = useCallback(() => setIsCommentsModalOpen(true), [])
  const openOverpass = useCallback(() => setIsOverpassModalOpen(true), [])
  const openClone = useCallback(() => setIsCloneModalOpen(true), [])
  const openActions = useCallback(() => setIsActionsModalOpen(true), [])
  const closeReport = useCallback(() => setIsReportModalOpen(false), [])
  const closeReportHistory = useCallback(() => setIsReportHistoryModalOpen(false), [])
  const closeComments = useCallback(() => setIsCommentsModalOpen(false), [])
  const closeOverpass = useCallback(() => setIsOverpassModalOpen(false), [])
  const closeClone = useCallback(() => setIsCloneModalOpen(false), [])
  const closeActions = useCallback(() => setIsActionsModalOpen(false), [])

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo(
    () => ({
      isReportModalOpen,
      isReportHistoryModalOpen,
      isCommentsModalOpen,
      isOverpassModalOpen,
      isCloneModalOpen,
      isActionsModalOpen,
      openReport,
      openReportHistory,
      openComments,
      openOverpass,
      openClone,
      openActions,
      closeReport,
      closeReportHistory,
      closeComments,
      closeOverpass,
      closeClone,
      closeActions,
      setReportOpen: setIsReportModalOpen,
      setReportHistoryOpen: setIsReportHistoryModalOpen,
      setCommentsOpen: setIsCommentsModalOpen,
      setOverpassOpen: setIsOverpassModalOpen,
      setCloneOpen: setIsCloneModalOpen,
      setActionsOpen: setIsActionsModalOpen,
    }),
    [
      isReportModalOpen,
      isReportHistoryModalOpen,
      isCommentsModalOpen,
      isOverpassModalOpen,
      isCloneModalOpen,
      isActionsModalOpen,
      openReport,
      openReportHistory,
      openComments,
      openOverpass,
      openClone,
      openActions,
      closeReport,
      closeReportHistory,
      closeComments,
      closeOverpass,
      closeClone,
      closeActions,
    ]
  )

  return <ChallengeModalsContext.Provider value={value}>{children}</ChallengeModalsContext.Provider>
}
