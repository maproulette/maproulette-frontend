import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { isTagFixTask } from '@/lib/cooperativeWork'
import type { EntityEdit } from '@/lib/idChanges'
import { useTaskContext } from './TaskContext'

type ActiveView = 'map' | 'id'

export interface EditorViewport {
  lat: number
  lng: number
  zoom: number
}

interface EditorContextType {
  activeView: ActiveView
  idEditorMounted: boolean
  idUnsavedCount: number
  idViewportRef: React.RefObject<EditorViewport | null>
  /** Ref populated by IdEditorView — call .current(osmEntityId) to highlight, .current(null) to clear */
  highlightIdEntityRef: React.RefObject<((osmEntityId: string | null) => void) | null>
  /** Ref populated by IdEditorView — maps MapRoulette task ID → iD entity ID (e.g. "n123") */
  taskToOsmIdRef: React.RefObject<Record<number, string> | null>
  /** Ref populated by IdEditorView — call .current(osmEntityIds) to select entities in iD via modeSelect */
  selectIdEntitiesRef: React.RefObject<((osmEntityIds: string[]) => void) | null>
  openIdEditor: () => void
  showMap: () => void
  setIdUnsavedCount: (count: number) => void
  /** True once MapRoulette has applied the challenge's suggestion in the editor. */
  suggestionApplied: boolean
  setSuggestionApplied: (applied: boolean) => void
  /**
   * True when the editor holds anything beyond the suggestion MapRoulette
   * applied — a tag hand-edited, the suggestion undone, geometry moved, an
   * element drawn. False when it holds the suggestion and nothing else, which
   * is when there is nothing to reset.
   */
  editsDivergeFromSuggestion: boolean
  setEditsDivergeFromSuggestion: (diverged: boolean) => void
  /** Edits currently pending in the editor, refreshed on every history change. */
  pendingEdits: EntityEdit[]
  setPendingEdits: (edits: EntityEdit[]) => void
  /**
   * Populated by IdEditorView; puts the editor back to the challenge's
   * suggestion, discarding everything the mapper has done since.
   */
  resetToSuggestionRef: React.RefObject<(() => void) | null>
  /** Populated by IdEditorView; discards every unsaved edit in the editor. */
  discardIdEditsRef: React.RefObject<(() => void) | null>
}

const EditorContext = createContext<EditorContextType | null>(null)

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeView, setActiveView] = useState<ActiveView>('map')
  const [idEditorMounted, setIdEditorMounted] = useState(false)
  const [idUnsavedCount, setIdUnsavedCount] = useState(0)
  const [suggestionApplied, setSuggestionApplied] = useState(false)
  const [editsDivergeFromSuggestion, setEditsDivergeFromSuggestion] = useState(false)
  const [pendingEdits, setPendingEdits] = useState<EntityEdit[]>([])
  const resetToSuggestionRef = useRef<(() => void) | null>(null)
  const discardIdEditsRef = useRef<(() => void) | null>(null)
  const idViewportRef = useRef<EditorViewport | null>(null)
  const highlightIdEntityRef = useRef<((osmEntityId: string | null) => void) | null>(null)
  const taskToOsmIdRef = useRef<Record<number, string> | null>({})
  const selectIdEntitiesRef = useRef<((osmEntityIds: string[]) => void) | null>(null)

  const openIdEditor = useCallback(() => {
    setIdEditorMounted(true)
    setActiveView('id')
  }, [])

  const showMap = useCallback(() => {
    setActiveView('map')
  }, [])

  // A tag-fix task's whole point is the tag change waiting to be applied, and
  // that only happens inside the embedded editor — so open it as soon as the
  // mapper holds the lock and is actually working the task, rather than making
  // them find the button first.
  //
  // Once per task: a mapper who closes the editor gets to keep it closed.
  const { task, isLocked } = useTaskContext()
  const autoOpenedTaskRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isLocked || autoOpenedTaskRef.current === task.id) return
    if (!isTagFixTask(task)) return
    autoOpenedTaskRef.current = task.id
    openIdEditor()
  }, [isLocked, task, openIdEditor])

  const value = useMemo(
    () => ({
      activeView,
      idEditorMounted,
      idUnsavedCount,
      idViewportRef,
      highlightIdEntityRef,
      taskToOsmIdRef,
      selectIdEntitiesRef,
      openIdEditor,
      showMap,
      setIdUnsavedCount,
      suggestionApplied,
      setSuggestionApplied,
      editsDivergeFromSuggestion,
      setEditsDivergeFromSuggestion,
      pendingEdits,
      setPendingEdits,
      resetToSuggestionRef,
      discardIdEditsRef,
    }),
    [
      activeView,
      idEditorMounted,
      idUnsavedCount,
      openIdEditor,
      showMap,
      suggestionApplied,
      editsDivergeFromSuggestion,
      pendingEdits,
    ]
  )

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}

/**
 * The editor's state where there is one, or null. The task info panel also
 * renders outside the task page, where no editor exists.
 */
export const useOptionalEditorContext = () => useContext(EditorContext)

export const useEditorContext = () => {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditorContext must be used within an EditorProvider')
  }
  return context
}
