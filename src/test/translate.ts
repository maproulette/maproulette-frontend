import { createIntl } from 'react-intl'
import type { TranslateFn } from '@/i18n'

const intl = createIntl({ locale: 'en-US', defaultLocale: 'en-US', messages: {}, onError: () => {} })

export const testT: TranslateFn = intl.formatMessage
