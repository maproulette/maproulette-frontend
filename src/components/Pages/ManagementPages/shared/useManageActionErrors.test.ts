// @vitest-environment happy-dom
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'
import { logger } from '@/lib/logger'
import { renderHook } from '@/test/renderHook'
import { useManageActionErrors } from './useManageActionErrors'

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }))
vi.mock('@/i18n', async () => {
  const { testT } = await import('@/test/translate')
  return { useIntl: () => ({ t: testT }) }
})
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

describe('useManageActionErrors', () => {
  it.each([
    ['challengeDelete', 'Unable to delete challenge.'],
    ['challengeArchive', 'Unable to update archive status'],
    ['challengeSave', 'Unable to save your changes.'],
    ['projectSave', 'Unable to save your changes'],
    ['projectDelete', 'Unable to delete project.'],
  ] as const)('%s logs the error and shows "%s"', (action, message) => {
    const { result } = renderHook(() => useManageActionErrors())
    const error = new Error('boom')

    result.current[action](error)

    expect(toast.error).toHaveBeenCalledWith(message)
    expect(logger.error).toHaveBeenCalledWith(expect.any(String), { error })
  })
})
