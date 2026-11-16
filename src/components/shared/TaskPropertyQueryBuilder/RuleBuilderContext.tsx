import { createContext, type ReactNode, useContext, useMemo } from 'react'
import { numberOperators, stringOperators } from './operators'
import type { PropertyOperator, RuleValueType } from './propertyRuleTypes'

interface RuleBuilderContextValue {
  /** Operators offered for a given value type. */
  operatorsFor: (valueType: 'string' | 'number') => PropertyOperator[]
  /** Property names found on the challenge's tasks, offered as suggestions. */
  propertyKeys: string[]
  /** Value types a rule can be given. */
  valueTypes: RuleValueType[]
}

const DEFAULT_VALUE_TYPES: RuleValueType[] = ['string', 'number']

const defaultOperatorsFor = (valueType: 'string' | 'number'): PropertyOperator[] =>
  valueType === 'number' ? numberOperators : stringOperators

const RuleBuilderContext = createContext<RuleBuilderContextValue>({
  operatorsFor: defaultOperatorsFor,
  propertyKeys: [],
  valueTypes: DEFAULT_VALUE_TYPES,
})

/**
 * Configuration shared by every rule in a query builder. Rule groups nest
 * arbitrarily deep, so this rides context rather than being threaded through
 * each level as props.
 */
export const RuleBuilderProvider = ({
  operatorsFor,
  propertyKeys,
  valueTypes,
  children,
}: {
  operatorsFor?: (valueType: 'string' | 'number') => PropertyOperator[]
  propertyKeys?: string[]
  valueTypes?: RuleValueType[]
  children: ReactNode
}) => {
  const value = useMemo(
    () => ({
      operatorsFor: operatorsFor ?? defaultOperatorsFor,
      propertyKeys: propertyKeys ?? [],
      valueTypes: valueTypes ?? DEFAULT_VALUE_TYPES,
    }),
    [operatorsFor, propertyKeys, valueTypes]
  )

  return <RuleBuilderContext.Provider value={value}>{children}</RuleBuilderContext.Provider>
}

export const useRuleBuilder = () => useContext(RuleBuilderContext)
