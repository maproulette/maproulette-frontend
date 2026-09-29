import type { Preview } from '@storybook/react-vite'

import { IntlProvider } from '../src/i18n'
import '../src/main.css'
import { DarkModeDocsContainer } from './DarkModeDocsContainer'
import { darkTheme, lightTheme } from './theme'

const preview: Preview = {
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <IntlProvider>
        <Story />
      </IntlProvider>
    ),
  ],
  parameters: {
    darkMode: {
      classTarget: 'html',
      stylePreview: true,
      dark: darkTheme,
      light: lightTheme,
    },

    docs: {
      container: DarkModeDocsContainer,
    },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    options: {
      storySort: {
        order: ['Introduction', '*'],
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
}

export default preview
