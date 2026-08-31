import { logger } from '@/lib/logger'
import type { BinaryGroup, BinaryLeaf, BinaryNode, PropertyOperator } from './propertyRuleTypes'

// The backend's `Challenge.matchesJSONRule` / `PriorityRule.doesMatch` expect
// rules shaped like {condition: "AND"|"OR", rules: [{value: "key.value",
// type: "string"|"integer"|"double"|"long", operator: <see tables>}]}. Our
// in-app `BinaryNode` is a left/right tree with lowercase `and`/`or` and a
// different operator vocabulary, so every save/load has to cross this seam.

interface BackendLeaf {
  value: string
  type: string
  operator: string
}

interface BackendGroup {
  condition: 'AND' | 'OR'
  rules: Array<BackendLeaf | BackendGroup>
}

type BackendNode = BackendLeaf | BackendGroup

const isGroup = (node: BinaryNode): node is BinaryGroup =>
  (node as BinaryGroup).valueType === 'compound rule'

const STRING_OP_TO_BACKEND: Record<PropertyOperator, string> = {
  equals: 'equal',
  notEqual: 'not_equal',
  contains: 'contains',
  exists: 'is_not_empty',
  missing: 'is_empty',
  greaterThan: 'equal',
  lessThan: 'equal',
  greaterThanOrEqual: 'equal',
  lessThanOrEqual: 'equal',
}

const NUMBER_OP_TO_BACKEND: Partial<Record<PropertyOperator, string>> = {
  equals: '==',
  notEqual: '!=',
  greaterThan: '>',
  lessThan: '<',
  greaterThanOrEqual: '>=',
  lessThanOrEqual: '<=',
}

const leafToBackend = (leaf: BinaryLeaf): BackendLeaf | null => {
  const key = leaf.key.trim()
  if (!key) return null
  const isNumber = leaf.valueType === 'number'
  // `double` is the most permissive numeric type the backend accepts — its
  // value parser handles both decimal (`0.8`) and integer-looking (`5`)
  // strings. Picking `integer` here would fail for any decimal value with
  // `"0.8".toLong → NumberFormatException`, aborting the recompute.
  const type = isNumber ? 'double' : 'string'
  const operator = isNumber
    ? (NUMBER_OP_TO_BACKEND[leaf.operator] ?? '==')
    : (STRING_OP_TO_BACKEND[leaf.operator] ?? 'equal')
  // MR2 bug workaround kept in MR3: empty values roundtrip through a single
  // space so `split(".", 2)` still produces two elements on the backend.
  const value = leaf.value?.length ? leaf.value : ' '
  return { value: `${key}.${value}`, type, operator }
}

const nodeToBackend = (node: BinaryNode): BackendNode | null => {
  if (!isGroup(node)) return leafToBackend(node)
  const left = nodeToBackend(node.left)
  const right = nodeToBackend(node.right)
  const children = [left, right].filter((n): n is BackendNode => n != null)
  if (children.length === 0) return null
  if (children.length === 1) return children[0]
  return {
    condition: node.condition === 'or' ? 'OR' : 'AND',
    rules: children,
  }
}

/**
 * Convert a BinaryNode tree to the backend's rule JSON shape. Returns the
 * empty string when the tree is empty/invalid — the backend's DAL treats
 * `""` (and `"{}"`) as "clear this rule", so sending empty-string lets the
 * editor actually delete a previously-saved rule. Returning `undefined`
 * here would drop the key from the JSON payload, and the backend's update
 * path would then keep the persisted rule untouched.
 */
export const binaryToBackendJson = (node: BinaryNode | null): string => {
  if (!node) return ''
  const converted = nodeToBackend(node)
  if (!converted) return ''
  // Backend wants a top-level group; wrap a single leaf in a 1-element AND.
  const top: BackendGroup =
    'rules' in converted ? converted : { condition: 'AND', rules: [converted] }
  return JSON.stringify(top)
}

const STRING_OP_FROM_BACKEND: Record<string, PropertyOperator> = {
  equal: 'equals',
  not_equal: 'notEqual',
  contains: 'contains',
  is_empty: 'missing',
  is_not_empty: 'exists',
}

const NUMBER_OP_FROM_BACKEND: Record<string, PropertyOperator> = {
  '==': 'equals',
  '!=': 'notEqual',
  '>': 'greaterThan',
  '>=': 'greaterThanOrEqual',
  '<': 'lessThan',
  '<=': 'lessThanOrEqual',
}

const NUMERIC_TYPES = new Set(['integer', 'double', 'long', 'number'])

const parseBackendLeaf = (leaf: Record<string, unknown>): BinaryLeaf | null => {
  const rawValue = leaf.value
  if (typeof rawValue !== 'string') return null
  const dotIndex = rawValue.indexOf('.')
  if (dotIndex < 0) return null
  const key = rawValue.slice(0, dotIndex).trim()
  const rest = rawValue.slice(dotIndex + 1)
  const value = rest === ' ' ? '' : rest
  const rawType = typeof leaf.type === 'string' ? leaf.type : 'string'
  const isNumber = NUMERIC_TYPES.has(rawType)
  const rawOperator = typeof leaf.operator === 'string' ? leaf.operator : ''
  const operator = isNumber
    ? NUMBER_OP_FROM_BACKEND[rawOperator]
    : STRING_OP_FROM_BACKEND[rawOperator]
  if (!operator) return null
  const result: BinaryLeaf = { key, value, operator }
  if (isNumber) result.valueType = 'number'
  return result
}

const groupChildrenToBinary = (
  children: BackendNode[],
  condition: 'and' | 'or'
): BinaryNode | null => {
  const nodes: BinaryNode[] = []
  for (const child of children) {
    const converted = nodeFromBackend(child)
    if (converted) nodes.push(converted)
  }
  if (nodes.length === 0) return null
  if (nodes.length === 1) return nodes[0]
  // Fold left so AND-chains become left-associated; query builder UI will
  // normalize them back on first edit via `binaryToFlat`.
  return nodes.reduce((left, right) => ({
    valueType: 'compound rule',
    condition,
    left,
    right,
  }))
}

const nodeFromBackend = (raw: unknown): BinaryNode | null => {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.rules)) {
    const rawCondition = typeof obj.condition === 'string' ? obj.condition.toLowerCase() : 'and'
    const condition: 'and' | 'or' = rawCondition === 'or' ? 'or' : 'and'
    return groupChildrenToBinary(obj.rules as BackendNode[], condition)
  }
  return parseBackendLeaf(obj)
}

/**
 * Parse a server-side rule (string or already-parsed object) into a
 * BinaryNode. Returns null when the input is empty, `{}`, or shaped in a way
 * we can't recognize — the editor surfaces that as "no rules" rather than
 * blowing up, and the user can start fresh.
 */
export const backendJsonToBinary = (raw: unknown): BinaryNode | null => {
  if (raw == null) return null
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed || trimmed === '{}') return null
    try {
      parsed = JSON.parse(trimmed)
    } catch (error) {
      logger.warn('Could not parse backend priority rule JSON', { error })
      return null
    }
  }
  if (!parsed || typeof parsed !== 'object') return null
  // Detect rules already in our BinaryNode shape (e.g. saved by an older MR4
  // build before this converter existed). Pass them through untouched so we
  // don't silently corrupt in-flight drafts.
  const obj = parsed as Record<string, unknown>
  const looksBinary =
    obj.valueType === 'compound rule' ||
    (typeof obj.key === 'string' && typeof obj.operator === 'string' && !('rules' in obj))
  if (looksBinary) return parsed as BinaryNode
  return nodeFromBackend(parsed)
}
