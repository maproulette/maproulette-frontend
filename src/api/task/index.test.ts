import { describe, expect, it } from 'vitest'
import { taskBulk } from './bulk'
import { taskComments } from './comments'
import { task } from './index'
import { taskMultiple } from './multiple'
import { taskSingle } from './single'
import { taskTags } from './tags'

describe('task', () => {
  it('merges every source module without any member being overwritten', () => {
    const sources = {
      ...taskSingle,
      ...taskMultiple,
      ...taskComments,
      ...taskTags,
      ...taskBulk,
    }

    expect(Object.keys(task).sort()).toEqual(Object.keys(sources).sort())
    for (const key of Object.keys(sources)) {
      expect(task[key as keyof typeof task]).toBe(sources[key as keyof typeof sources])
    }
  })

  it('re-exports every member of taskSingle by identity', () => {
    for (const [key, value] of Object.entries(taskSingle)) {
      expect(task[key as keyof typeof task]).toBe(value)
    }
  })

  it('re-exports every member of taskMultiple by identity', () => {
    for (const [key, value] of Object.entries(taskMultiple)) {
      expect(task[key as keyof typeof task]).toBe(value)
    }
  })

  it('re-exports every member of taskComments by identity', () => {
    for (const [key, value] of Object.entries(taskComments)) {
      expect(task[key as keyof typeof task]).toBe(value)
    }
  })

  it('re-exports every member of taskTags by identity', () => {
    for (const [key, value] of Object.entries(taskTags)) {
      expect(task[key as keyof typeof task]).toBe(value)
    }
  })

  it('re-exports every member of taskBulk by identity', () => {
    for (const [key, value] of Object.entries(taskBulk)) {
      expect(task[key as keyof typeof task]).toBe(value)
    }
  })

  it('has no key collisions between the merged source modules', () => {
    const keySets = [
      Object.keys(taskSingle),
      Object.keys(taskMultiple),
      Object.keys(taskComments),
      Object.keys(taskTags),
      Object.keys(taskBulk),
    ]
    const allKeys = keySets.flat()
    const uniqueKeys = new Set(allKeys)
    expect(uniqueKeys.size).toBe(allKeys.length)
  })
})
