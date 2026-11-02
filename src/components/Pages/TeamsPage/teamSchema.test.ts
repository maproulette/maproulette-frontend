import { describe, expect, it } from 'vitest'
import { testT } from '@/test/translate'
import { makeTeamFormSchema } from './teamSchema.ts'

const teamFormSchema = makeTeamFormSchema(testT)

const validInput = {
  name: 'Road Warriors',
  description: 'A team dedicated to fixing road connectivity issues.',
  avatarURL: 'https://example.com/avatar.png',
}

describe('teamFormSchema', () => {
  it('accepts a fully populated valid input', () => {
    const result = teamFormSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('accepts the minimal input with only the required name field', () => {
    const result = teamFormSchema.safeParse({ name: 'Minimal Team' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty name', () => {
    const result = teamFormSchema.safeParse({ ...validInput, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === 'Name is required')).toBe(true)
    }
  })

  it('rejects a name over 100 characters', () => {
    const result = teamFormSchema.safeParse({ ...validInput, name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message === 'Keep it under 100 characters')
      ).toBe(true)
    }
  })

  it('accepts a name exactly at the 100 character boundary', () => {
    const result = teamFormSchema.safeParse({ ...validInput, name: 'a'.repeat(100) })
    expect(result.success).toBe(true)
  })

  it('rejects a description over 1000 characters', () => {
    const result = teamFormSchema.safeParse({ ...validInput, description: 'a'.repeat(1001) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message === 'Keep it under 1,000 characters')
      ).toBe(true)
    }
  })

  it('accepts a description exactly at the 1000 character boundary', () => {
    const result = teamFormSchema.safeParse({ ...validInput, description: 'a'.repeat(1000) })
    expect(result.success).toBe(true)
  })

  it('omits the optional description field without failing', () => {
    const { description: _description, ...rest } = validInput
    const result = teamFormSchema.safeParse(rest)
    expect(result.success).toBe(true)
  })

  it('rejects a malformed avatarURL', () => {
    const result = teamFormSchema.safeParse({ ...validInput, avatarURL: 'not-a-url' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === 'Must be a valid URL')).toBe(
        true
      )
    }
  })

  it('accepts an empty string for avatarURL', () => {
    const result = teamFormSchema.safeParse({ ...validInput, avatarURL: '' })
    expect(result.success).toBe(true)
  })

  it('omits the optional avatarURL field without failing', () => {
    const { avatarURL: _avatarURL, ...rest } = validInput
    const result = teamFormSchema.safeParse(rest)
    expect(result.success).toBe(true)
  })

  it('rejects input missing the required name field entirely', () => {
    const { name: _name, ...rest } = validInput
    const result = teamFormSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })
})
