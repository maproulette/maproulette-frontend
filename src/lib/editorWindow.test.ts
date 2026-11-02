/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { openEditorWindow } from './editorWindow'

const fakeWindow = () => ({ closed: false, close: vi.fn(), opener: {} as unknown })

describe('openEditorWindow', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('closes the previous editor tab before opening the next', () => {
    const first = fakeWindow()
    const second = fakeWindow()
    const open = vi
      .spyOn(window, 'open')
      .mockReturnValueOnce(first as unknown as Window)
      .mockReturnValueOnce(second as unknown as Window)

    openEditorWindow('https://editor.example/a')
    openEditorWindow('https://editor.example/b')

    expect(first.close).toHaveBeenCalled()
    expect(second.close).not.toHaveBeenCalled()
    expect(open).toHaveBeenLastCalledWith('https://editor.example/b', '_blank')
  })

  it('cuts the editor tab off from MapRoulette', () => {
    const tab = fakeWindow()
    vi.spyOn(window, 'open').mockReturnValueOnce(tab as unknown as Window)

    openEditorWindow('https://editor.example/a')

    expect(tab.opener).toBeNull()
  })

  it('leaves a tab the mapper already closed alone', () => {
    const closedTab = { ...fakeWindow(), closed: true }
    vi.spyOn(window, 'open')
      .mockReturnValueOnce(closedTab as unknown as Window)
      .mockReturnValueOnce(null)

    openEditorWindow('https://editor.example/a')
    openEditorWindow('https://editor.example/b')

    expect(closedTab.close).not.toHaveBeenCalled()
  })
})
