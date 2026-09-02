import { createContext, type ReactNode, useContext, useMemo } from 'react'
import { numberOperators, stringOperators } from './operators'
import type { PropertyOperator } from './propertyRuleTypes'

interface RuleBuilderContextValue {
  /** Operators offered for a given value type. */
  operatorsFor: (valueType: 'string' | 'number') => PropertyOperator[]
  /** Property names found on the challenge's tasks, offered as suggestions. */
  propertyKeys: string[]
}

const defaultOperatorsFor = (valueType: 'string' | 'number'): PropertyOperator[] =>
  valueType === 'number' ? numberOperators : stringOperators

const RuleBuilderContext = createContext<RuleBuilderContextValue>({
  operatorsFor: defaultOperatorsFor,
  propertyKeys: [],
})

/**
 * Configuration shared by every rule in a query builder. Rule groups nest
 * arbitrarily deep, so this rides context rather than being threaded through
 * each level as props.
 */
export const RuleBuilderProvider = ({
  operatorsFor,
  propertyKeys,
  children,
}: {
  operatorsFor?: (valueType: 'string' | 'number') => PropertyOperator[]
  propertyKeys?: string[]
  children: ReactNode
}) => {
  const value = useMemo(
    () => ({
      operatorsFor: operatorsFor ?? defaultOperatorsFor,
      propertyKeys: propertyKeys ?? [],
    }),
    [operatorsFor, propertyKeys]
  )

  return <RuleBuilderContext.Provider value={value}>{children}</RuleBuilderContext.Provider>
}

export const useRuleBuilder = () => useContext(RuleBuilderContext)
