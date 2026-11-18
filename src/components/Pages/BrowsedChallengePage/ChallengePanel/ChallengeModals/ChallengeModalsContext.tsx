import { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface ChallengeModalsContextType {
  isReportModalOpen: boolean
  isReportHistoryModalOpen: boolean
  isCommentsModalOpen: boolean
  isOverpassModalOpen: boolean
  openReport: () => void
  openReportHistory: () => void
  openComments: () => void
  openOverpass: () => void
  closeReport: () => void
  closeReportHistory: () => void
  closeComments: () => void
  closeOverpass: () => void
  setReportOpen: (open: boolean) => void
  setReportHistoryOpen: (open: boolean) => void
  setCommentsOpen: (open: boolean) => void
  setOverpassOpen: (open: boolean) => void
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

  // All callbacks are memoized because they are stored in the context value.
  const openReport = useCallback(() => setIsReportModalOpen(true), [])
  const openReportHistory = useCallback(() => setIsReportHistoryModalOpen(true), [])
  const openComments = useCallback(() => setIsCommentsModalOpen(true), [])
  const openOverpass = useCallback(() => setIsOverpassModalOpen(true), [])
  const closeReport = useCallback(() => setIsReportModalOpen(false), [])
  const closeReportHistory = useCallback(() => setIsReportHistoryModalOpen(false), [])
  const closeComments = useCallback(() => setIsCommentsModalOpen(false), [])
  const closeOverpass = useCallback(() => setIsOverpassModalOpen(false), [])

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo(
    () => ({
      isReportModalOpen,
      isReportHistoryModalOpen,
      isCommentsModalOpen,
      isOverpassModalOpen,
      openReport,
      openReportHistory,
      openComments,
      openOverpass,
      closeReport,
      closeReportHistory,
      closeComments,
      closeOverpass,
      setReportOpen: setIsReportModalOpen,
      setReportHistoryOpen: setIsReportHistoryModalOpen,
      setCommentsOpen: setIsCommentsModalOpen,
      setOverpassOpen: setIsOverpassModalOpen,
    }),
    [
      isReportModalOpen,
      isReportHistoryModalOpen,
      isCommentsModalOpen,
      isOverpassModalOpen,
      openReport,
      openReportHistory,
      openComments,
      openOverpass,
      closeReport,
      closeReportHistory,
      closeComments,
      closeOverpass,
    ]
  )

  return <ChallengeModalsContext.Provider value={value}>{children}</ChallengeModalsContext.Provider>
}
