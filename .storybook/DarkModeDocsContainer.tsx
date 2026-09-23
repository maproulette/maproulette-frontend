import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks'
import { useDarkMode } from 'storybook-dark-mode'

import { darkTheme, lightTheme } from './theme'

export const DarkModeDocsContainer = (props: DocsContainerProps) => {
  const isDark = useDarkMode()

  return <DocsContainer {...props} theme={isDark ? darkTheme : lightTheme} />
}
