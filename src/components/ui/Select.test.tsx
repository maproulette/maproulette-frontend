import { describe, expect, it, vi } from 'vitest'
import { Select } from './Select'

const forwardedChange = (onValueChange?: (value: string) => void) =>
  (Select({ onValueChange }).props as { onValueChange?: (value: string) => void }).onValueChange

describe('Select', () => {
  it('passes a chosen value on', () => {
    const onValueChange = vi.fn()
    forwardedChange(onValueChange)?.('2')
    expect(onValueChange).toHaveBeenCalledWith('2')
  })

  it("drops the empty value Radix sends when a stored value isn't among its options yet", () => {
    const onValueChange = vi.fn()
    forwardedChange(onValueChange)?.('')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('leaves a Select without a change handler without one', () => {
    expect(forwardedChange()).toBeUndefined()
  })
})
