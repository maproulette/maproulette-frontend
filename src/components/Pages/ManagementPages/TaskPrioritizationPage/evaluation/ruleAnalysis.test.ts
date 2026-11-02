import { describe, expect, it } from 'vitest'
import { TaskPriority, type TaskPriorityValue } from '@/types/Priority'
import { type AnalyzeInput, analyzeWarnings } from './ruleAnalysis'

const baseInput = (overrides: Partial<AnalyzeInput> = {}): AnalyzeInput => ({
  defaultPriority: TaskPriority.MEDIUM,
  tierCounts: { 0: 0, 1: 0, 2: 0 },
  tierHasAnyConfig: { 0: false, 1: false, 2: false },
  totalTasks: 0,
  ...overrides,
})

describe('analyzeWarnings', () => {
  describe('shape', () => {
    it('always returns tier entries for every priority, even with no config', () => {
      const result = analyzeWarnings(baseInput())

      expect(Object.keys(result.tier).sort()).toEqual(['0', '1', '2'])
      expect(result.tier[0]).toEqual([])
      expect(result.tier[1]).toEqual([])
      expect(result.tier[2]).toEqual([])
    })

    it('does not mutate warnings from a previous call (no shared array reference)', () => {
      const first = analyzeWarnings(
        baseInput({
          tierHasAnyConfig: { 0: true, 1: false, 2: false },
          tierCounts: { 0: 0, 1: 0, 2: 0 },
        })
      )
      expect(first.tier[0]).toHaveLength(1)

      const second = analyzeWarnings(baseInput())
      expect(second.tier[0]).toEqual([])
      // Mutating the second result must not affect anything cached from the first call.
      second.tier[0].push({ kind: 'dead-rule', message: { id: 'test.deadRule' } })
      expect(first.tier[0]).toHaveLength(1)
    })
  })

  describe('no-rules (global)', () => {
    it('warns when no tier has any configuration at all', () => {
      const result = analyzeWarnings(baseInput({ totalTasks: 10 }))

      expect(result.global).toEqual([
        expect.objectContaining({ kind: 'no-rules' }),
      ])
    })

    it('does not warn when at least one tier is configured', () => {
      const result = analyzeWarnings(
        baseInput({
          tierHasAnyConfig: { 0: false, 1: true, 2: false },
          tierCounts: { 0: 0, 1: 5, 2: 0 },
          totalTasks: 10,
        })
      )

      expect(result.global.some((w) => w.kind === 'no-rules')).toBe(false)
    })
  })

  describe('dead-rule (tier)', () => {
    it('warns when a configured tier matches zero tasks out of a nonempty set', () => {
      const result = analyzeWarnings(
        baseInput({
          tierHasAnyConfig: { 0: true, 1: false, 2: false },
          tierCounts: { 0: 0, 1: 0, 2: 10 },
          totalTasks: 10,
        })
      )

      expect(result.tier[0]).toEqual([expect.objectContaining({ kind: 'dead-rule' })])
    })

    it('warns even when there are zero total tasks (still unreachable)', () => {
      const result = analyzeWarnings(
        baseInput({
          tierHasAnyConfig: { 0: true, 1: false, 2: false },
          tierCounts: { 0: 0, 1: 0, 2: 0 },
          totalTasks: 0,
        })
      )

      expect(result.tier[0].map((w) => w.kind)).toEqual(['dead-rule'])
    })

    it('does not warn for an unconfigured tier that matches zero tasks', () => {
      const result = analyzeWarnings(
        baseInput({
          tierHasAnyConfig: { 0: false, 1: false, 2: false },
          tierCounts: { 0: 0, 1: 0, 2: 0 },
          totalTasks: 10,
        })
      )

      expect(result.tier[0]).toEqual([])
    })

    it('does not warn for a configured tier that matches at least one (but not all) tasks', () => {
      const result = analyzeWarnings(
        baseInput({
          tierHasAnyConfig: { 0: true, 1: false, 2: false },
          tierCounts: { 0: 3, 1: 0, 2: 7 },
          totalTasks: 10,
        })
      )

      expect(result.tier[0]).toEqual([])
    })

    it('falls back to zero when a tier is missing from tierCounts', () => {
      const partialCounts = { 0: 5 } as unknown as Record<TaskPriorityValue, number>
      const result = analyzeWarnings(
        baseInput({
          tierHasAnyConfig: { 0: false, 1: true, 2: false },
          tierCounts: partialCounts,
          totalTasks: 10,
        })
      )

      expect(result.tier[1]).toEqual([expect.objectContaining({ kind: 'dead-rule' })])
    })
  })

  describe('all-match (tier)', () => {
    it('warns when a configured tier matches every task', () => {
      const result = analyzeWarnings(
        baseInput({
          tierHasAnyConfig: { 0: true, 1: false, 2: false },
          tierCounts: { 0: 10, 1: 0, 2: 0 },
          totalTasks: 10,
        })
      )

      expect(result.tier[0]).toEqual([expect.objectContaining({ kind: 'all-match' })])
    })

    it('does not warn when totalTasks is zero, even if count equals totalTasks (0 === 0)', () => {
      const result = analyzeWarnings(
        baseInput({
          tierHasAnyConfig: { 0: true, 1: false, 2: false },
          tierCounts: { 0: 0, 1: 0, 2: 0 },
          totalTasks: 0,
        })
      )

      expect(result.tier[0].some((w) => w.kind === 'all-match')).toBe(false)
    })

    it('does not warn for an unconfigured tier even if it happens to match every task', () => {
      const result = analyzeWarnings(
        baseInput({
          tierHasAnyConfig: { 0: false, 1: false, 2: false },
          tierCounts: { 0: 10, 1: 0, 2: 0 },
          totalTasks: 10,
        })
      )

      expect(result.tier[0]).toEqual([])
    })

    it('can warn on multiple tiers independently in the same pass', () => {
      const result = analyzeWarnings(
        baseInput({
          tierHasAnyConfig: { 0: true, 1: true, 2: false },
          tierCounts: { 0: 0, 1: 10, 2: 0 },
          totalTasks: 10,
        })
      )

      expect(result.tier[0].map((w) => w.kind)).toEqual(['dead-rule'])
      expect(result.tier[1].map((w) => w.kind)).toEqual(['all-match'])
      expect(result.tier[2]).toEqual([])
    })
  })

  describe('swallowed-default (global)', () => {
    it('warns when default is High, High has no rules, but other tiers do', () => {
      const result = analyzeWarnings(
        baseInput({
          defaultPriority: TaskPriority.HIGH,
          tierHasAnyConfig: { 0: false, 1: true, 2: false },
          tierCounts: { 0: 0, 1: 5, 2: 0 },
          totalTasks: 10,
        })
      )

      expect(result.global).toContainEqual(expect.objectContaining({ kind: 'swallowed-default' }))
    })

    it('does not warn when High itself has rules configured', () => {
      const result = analyzeWarnings(
        baseInput({
          defaultPriority: TaskPriority.HIGH,
          tierHasAnyConfig: { 0: true, 1: true, 2: false },
          tierCounts: { 0: 5, 1: 5, 2: 0 },
          totalTasks: 10,
        })
      )

      expect(result.global.some((w) => w.kind === 'swallowed-default')).toBe(false)
    })

    it('does not warn when the default priority is Medium', () => {
      const result = analyzeWarnings(
        baseInput({
          defaultPriority: TaskPriority.MEDIUM,
          tierHasAnyConfig: { 0: false, 1: true, 2: false },
          tierCounts: { 0: 0, 1: 5, 2: 0 },
          totalTasks: 10,
        })
      )

      expect(result.global.some((w) => w.kind === 'swallowed-default')).toBe(false)
    })

    it('does not warn when the default priority is Low', () => {
      const result = analyzeWarnings(
        baseInput({
          defaultPriority: TaskPriority.LOW,
          tierHasAnyConfig: { 0: false, 1: true, 2: false },
          tierCounts: { 0: 0, 1: 5, 2: 0 },
          totalTasks: 10,
        })
      )

      expect(result.global.some((w) => w.kind === 'swallowed-default')).toBe(false)
    })

    it('does not warn when no rules are configured at all (mutually exclusive with no-rules)', () => {
      const result = analyzeWarnings(
        baseInput({
          defaultPriority: TaskPriority.HIGH,
          tierHasAnyConfig: { 0: false, 1: false, 2: false },
          totalTasks: 10,
        })
      )

      expect(result.global).toEqual([
        expect.objectContaining({ kind: 'no-rules' }),
      ])
    })
  })

  describe('realistic combined scenarios', () => {
    it('produces no warnings for a well-formed three-tier configuration', () => {
      const result = analyzeWarnings(
        baseInput({
          defaultPriority: TaskPriority.LOW,
          tierHasAnyConfig: { 0: true, 1: true, 2: false },
          tierCounts: { 0: 2, 1: 3, 2: 5 },
          totalTasks: 10,
        })
      )

      expect(result.tier[0]).toEqual([])
      expect(result.tier[1]).toEqual([])
      expect(result.tier[2]).toEqual([])
      expect(result.global).toEqual([])
    })

    it('surfaces dead-rule, all-match, and swallowed-default together when applicable', () => {
      const result = analyzeWarnings(
        baseInput({
          defaultPriority: TaskPriority.HIGH,
          tierHasAnyConfig: { 0: false, 1: true, 2: true },
          tierCounts: { 0: 0, 1: 10, 2: 0 },
          totalTasks: 10,
        })
      )

      expect(result.tier[0]).toEqual([])
      expect(result.tier[1]).toEqual([expect.objectContaining({ kind: 'all-match' })])
      expect(result.tier[2]).toEqual([expect.objectContaining({ kind: 'dead-rule' })])
      expect(result.global).toEqual([
        expect.objectContaining({ kind: 'swallowed-default' }),
      ])
    })
  })
})
