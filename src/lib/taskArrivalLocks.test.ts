// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  getTaskArrivalLocks,
  recordTaskArrivalLocks,
  resetTaskArrivalLocks,
} from './taskArrivalLocks'

const arrivedFree = { heldThis: false, heldInChallenge: false }
const arrivedHolding = { heldThis: true, heldInChallenge: false }

beforeEach(() => {
  sessionStorage.clear()
  resetTaskArrivalLocks()
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

  it('survives a reload - the record lives in sessionStorage', () => {
    recordTaskArrivalLocks(102685, arrivedFree)
    resetTaskArrivalLocks() // as if the page were reloaded

    expect(getTaskArrivalLocks(102685)).toEqual(arrivedFree)
  })

  it('keeps the first verdict for a task - a later lock cannot rewrite it', () => {
    recordTaskArrivalLocks(102685, arrivedFree)
    recordTaskArrivalLocks(102685, arrivedHolding)

    expect(getTaskArrivalLocks(102685)).toEqual(arrivedFree)
  })

  it('keeps the first verdict across a reload too', () => {
    recordTaskArrivalLocks(102685, arrivedFree)
    resetTaskArrivalLocks()
    recordTaskArrivalLocks(102685, arrivedHolding)

    expect(getTaskArrivalLocks(102685)).toEqual(arrivedFree)
  })

  it('drops the tasks visited longest ago once the record is full', () => {
    for (let id = 1; id <= 205; id += 1) {
      recordTaskArrivalLocks(id, arrivedFree)
    }
    resetTaskArrivalLocks() // force reads to go back to sessionStorage

    expect(getTaskArrivalLocks(1)).toBeNull()
    expect(getTaskArrivalLocks(5)).toBeNull()
    expect(getTaskArrivalLocks(6)).toEqual(arrivedFree)
    expect(getTaskArrivalLocks(205)).toEqual(arrivedFree)
  })

  it('ignores stored junk rather than throwing', () => {
    sessionStorage.setItem('mr:taskArrivalLocks', '{"not":"an array"}')
    expect(getTaskArrivalLocks(102685)).toBeNull()

    sessionStorage.setItem('mr:taskArrivalLocks', 'not json at all')
    expect(getTaskArrivalLocks(102685)).toBeNull()
  })

  it('skips malformed entries but keeps the sound ones', () => {
    sessionStorage.setItem(
      'mr:taskArrivalLocks',
      JSON.stringify([{ id: 'nope' }, null, { id: 102685, heldThis: false, heldInChallenge: true }])
    )

    expect(getTaskArrivalLocks(102685)).toEqual({ heldThis: false, heldInChallenge: true })
  })
})
