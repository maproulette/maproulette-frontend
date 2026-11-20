// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import { getTaskArrivalLocks, recordTaskArrivalLocks } from './taskArrivalLocks'

const arrivedFree = { heldThis: false, heldInChallenge: false }
const arrivedHolding = { heldThis: true, heldInChallenge: false }

beforeEach(() => {
  sessionStorage.clear()
})

describe('task arrival locks record', () => {
  it('has nothing to say about a task not yet visited', () => {
    expect(getTaskArrivalLocks(102685)).toBeNull()
  })

  it('gives back what was recorded, per task', () => {
    recordTaskArrivalLocks(102685, arrivedFree)
    recordTaskArrivalLocks(102686, arrivedHolding)

    expect(getTaskArrivalLocks(102685)).toEqual(arrivedFree)
    expect(getTaskArrivalLocks(102686)).toEqual(arrivedHolding)
  })

  it('keeps the first verdict for a task - a later lock cannot rewrite it', () => {
    recordTaskArrivalLocks(102685, arrivedFree)
    recordTaskArrivalLocks(102685, arrivedHolding)

    expect(getTaskArrivalLocks(102685)).toEqual(arrivedFree)
  })

  it('drops the tasks visited longest ago once the record is full', () => {
    for (let id = 1; id <= 205; id += 1) {
      recordTaskArrivalLocks(id, arrivedFree)
    }

    expect(getTaskArrivalLocks(1)).toBeNull()
    expect(getTaskArrivalLocks(5)).toBeNull()
    expect(getTaskArrivalLocks(6)).toEqual(arrivedFree)
    expect(getTaskArrivalLocks(205)).toEqual(arrivedFree)
  })
})
