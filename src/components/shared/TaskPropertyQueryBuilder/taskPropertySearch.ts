import type { components } from '@/types/openApiTypes'
import type { BinaryGroup, BinaryNode, PropertyOperator } from './propertyRuleTypes'

export type TaskPropertySearch = components['schemas']['org.maproulette.session.TaskPropertySearch']

// The backend's task-property search vocabulary (`TaskPropertySearchType`),
// which is not the same as the one the priority-rule endpoints take — see
// backendRuleShape.ts for that seam.
const STRING_SEARCH_TYPE: Partial<Record<PropertyOperator, string>> = {
  equals: 'equals',
  notEqual: 'not_equal',
  contains: 'contains',
  exists: 'exists',
  missing: 'missing',
}

const NUMBER_SEARCH_TYPE: Partial<Record<PropertyOperator, string>> = {
  equals: 'equals',
  notEqual: 'not_equal',
  greaterThan: 'greater_than',
  lessThan: 'less_than',
}

/** Operators the backend can actually search on, for the given value type. */
export const searchableOperators = (valueType: 'string' | 'number'): PropertyOperator[] =>
  Object.keys(
    valueType === 'number' ? NUMBER_SEARCH_TYPE : STRING_SEARCH_TYPE
  ) as PropertyOperator[]

const isGroup = (node: BinaryNode): node is BinaryGroup =>
  (node as BinaryGroup).valueType === 'compound rule'

/**
 * Convert the query builder's rule tree into the `taskPropertySearch` body the
 * task endpoints accept. Returns null for a tree the backend cannot express —
 * an empty key, or an operator with no equivalent — so callers send no filter
 * rather than a filter that silently means something else.
 */
export const binaryToTaskPropertySearch = (
  node: BinaryNode | null | undefined
): TaskPropertySearch | null => {
  if (!node) return null

  if (isGroup(node)) {
    const left = binaryToTaskPropertySearch(node.left)
    const right = binaryToTaskPropertySearch(node.right)
    // A compound rule with only one usable side degrades to that side rather
    // than dropping the whole filter.
    if (!left) return right
    if (!right) return left
    return { operationType: node.condition, left, right }
  }

  const key = node.key.trim()
  if (!key) return null

  const valueType = node.valueType === 'number' ? 'number' : 'string'
  const searchType = (valueType === 'number' ? NUMBER_SEARCH_TYPE : STRING_SEARCH_TYPE)[
    node.operator
  ]
  if (!searchType) return null

  const value = node.value ?? ''

  // A comma-separated rule matches the property against any one of several
  // values. The backend has no "in" operator, so it becomes a chain of ORs —
  // one leaf per value — which is what MapRoulette 3 sent too.
  if (node.commaSeparate && value.includes(',')) {
    const values = value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    if (values.length === 0) return null
    const leaves: TaskPropertySearch[] = values.map((one) => ({
      key,
      value: one,
      valueType,
      searchType,
    }))
    return leaves.reduceRight((right, left) => ({ operationType: 'or', left, right }))
  }

  return { key, value, valueType, searchType }
}
