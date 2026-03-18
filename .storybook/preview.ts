import type { Preview } from '@storybook/react'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a2e' },
      ],
    },
  },
  globalTypes: {
    darkMode: {
      description: 'Toggle dark mode',
      defaultValue: false,
      toolbar: {
        title: 'Dark Mode',
        icon: 'moon',
        items: [
          { value: false, title: 'Light' },
          { value: true, title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const isDark = context.globals.darkMode
      // Apply dark class to the html element for Tailwind dark mode
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', isDark)
      }
      return Story()
    },
  ],
}

export default preview
