import { describe, expect, it } from 'vitest'
import {
  isApprovedImage,
  isPendingImage,
  isRejectedImage,
  TEAM_IMAGE_STATUS_APPROVED,
  TEAM_IMAGE_STATUS_PENDING,
  TEAM_IMAGE_STATUS_REJECTED,
} from './TeamImage'

describe('team image status helpers', () => {
  it('recognizes a pending image', () => {
    expect(isPendingImage({ status: TEAM_IMAGE_STATUS_PENDING })).toBe(true)
    expect(isPendingImage({ status: TEAM_IMAGE_STATUS_APPROVED })).toBe(false)
    expect(isPendingImage({ status: TEAM_IMAGE_STATUS_REJECTED })).toBe(false)
  })

  it('recognizes an approved image', () => {
    expect(isApprovedImage({ status: TEAM_IMAGE_STATUS_APPROVED })).toBe(true)
    expect(isApprovedImage({ status: TEAM_IMAGE_STATUS_PENDING })).toBe(false)
    expect(isApprovedImage({ status: TEAM_IMAGE_STATUS_REJECTED })).toBe(false)
  })

  it('recognizes a rejected image', () => {
    expect(isRejectedImage({ status: TEAM_IMAGE_STATUS_REJECTED })).toBe(true)
    expect(isRejectedImage({ status: TEAM_IMAGE_STATUS_PENDING })).toBe(false)
    expect(isRejectedImage({ status: TEAM_IMAGE_STATUS_APPROVED })).toBe(false)
  })

  it('treats an unrecognized status as none of the three', () => {
    expect(isPendingImage({ status: 99 })).toBe(false)
    expect(isApprovedImage({ status: 99 })).toBe(false)
    expect(isRejectedImage({ status: 99 })).toBe(false)
  })

  it('matches the backend status constants', () => {
    expect(TEAM_IMAGE_STATUS_PENDING).toBe(0)
    expect(TEAM_IMAGE_STATUS_APPROVED).toBe(1)
    expect(TEAM_IMAGE_STATUS_REJECTED).toBe(2)
  })
})
