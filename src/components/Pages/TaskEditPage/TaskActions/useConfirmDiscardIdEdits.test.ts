/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@/test/renderHook'

const editor = vi.hoisted(() => ({
  idUnsavedCount: 0,
  discardIdEditsRef: { current: vi.fn() as (() => void) | null },
}))

vi.mock('@/components/Pages/TaskEditPage/contexts/EditorContext', () => ({
  useOptionalEditorContext: () => editor,
}))
vi.mock('@/i18n', () => ({ useIntl: () => ({ t: (_k: string, _v: unknown, d: string) => d }) }))

const { useConfirmDiscardIdEdits } = await import('./useConfirmDiscardIdEdits')

describe('useConfirmDiscardIdEdits', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    editor.idUnsavedCount = 0
    editor.discardIdEditsRef.current = vi.fn()
  })

  it('proceeds without asking when iD holds no unsaved edits', () => {
    const confirm = vi.fn()
    vi.stubGlobal('confirm', confirm)
    const { result } = renderHook(() => useConfirmDiscardIdEdits())

    expect(result.current()).toBe(true)
    expect(confirm).not.toHaveBeenCalled()
  })

  it('discards the edits when the mapper confirms', () => {
    editor.idUnsavedCount = 2
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    )
    const { result } = renderHook(() => useConfirmDiscardIdEdits())

    expect(result.current()).toBe(true)
    expect(editor.discardIdEditsRef.current).toHaveBeenCalled()
  })

  it('keeps the edits and stops when the mapper declines', () => {
    editor.idUnsavedCount = 2
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false)
    )
    const { result } = renderHook(() => useConfirmDiscardIdEdits())

    expect(result.current()).toBe(false)
    expect(editor.discardIdEditsRef.current).not.toHaveBeenCalled()
  })
})
