import { describe, expect, it } from 'vitest'
import type { Task } from '@/types/Task'
import type { User } from '@/types/User'
import { canEditTags } from './taskTagsPermissions.ts'

function makeTask(props: { status?: number; reviewStatus?: number } = {}): Task {
  return {
    status: props.status,
    review: props.reviewStatus != null ? { reviewStatus: props.reviewStatus } : undefined,
  } as Task
}

function makeUser(): User {
  return {} as User
}

describe('canEditTags', () => {
  it('returns false when task is undefined', () => {
    expect(canEditTags(undefined, makeUser())).toBe(false)
  })

  it('returns false when user is undefined', () => {
    expect(canEditTags(makeTask({ status: 0 }), undefined)).toBe(false)
  })

  it('returns false when both task and user are undefined', () => {
    expect(canEditTags(undefined, undefined)).toBe(false)
  })

  describe('status-based editability (EDITABLE_STATUSES = {0, 3, 6})', () => {
    it.each([
      [0, true], // Created
      [1, false], // Fixed
      [2, false], // Not an Issue
      [3, true], // Skipped
      [4, false], // Deleted
      [5, false], // Already Fixed
      [6, true], // Can't Complete
      [7, false], // Answered
      [8, false], // Validated
      [9, false], // Disabled
    ])('status %i -> canEdit=%s (with no review status)', (status, expected) => {
      expect(canEditTags(makeTask({ status }), makeUser())).toBe(expected)
    })
  })

  describe('review-status-based editability (EDITABLE_REVIEW_STATUSES = {0, 2, 4, 5})', () => {
    // Use a non-editable task status (1 = Fixed) so only reviewStatus drives the result.
    it.each([
      [0, true], // Review Requested
      [1, false], // Approved
      [2, true], // Rejected
      [3, false], // Assisted
      [4, true], // Disputed
      [5, true], // Unnecessary
    ])(
      'reviewStatus %i -> canEdit=%s (with non-editable task status)',
      (reviewStatus, expected) => {
        expect(canEditTags(makeTask({ status: 1, reviewStatus }), makeUser())).toBe(expected)
      }
    )
  })

  it('returns false when status is non-editable and reviewStatus is absent', () => {
    expect(canEditTags(makeTask({ status: 1 }), makeUser())).toBe(false)
  })

  it('treats a missing task.status as 0 (Created), which is editable', () => {
    expect(canEditTags(makeTask({ status: undefined }), makeUser())).toBe(true)
  })

  it('returns true when status is non-editable but reviewStatus is editable', () => {
    expect(canEditTags(makeTask({ status: 1, reviewStatus: 0 }), makeUser())).toBe(true)
  })

  it('returns true when status is editable even if reviewStatus is not', () => {
    expect(canEditTags(makeTask({ status: 0, reviewStatus: 1 }), makeUser())).toBe(true)
  })
})
