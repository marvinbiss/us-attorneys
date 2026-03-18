import type { Meta, StoryObj } from '@storybook/react'
import Header from './Header'

/**
 * Header stories require mocking several context providers and Next.js hooks.
 * Storybook's @storybook/nextjs framework handles Next.js router/navigation mocks.
 * Additional context providers (MobileMenuContext, useFavorites) are mocked via
 * Storybook decorators.
 */
const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    // Next.js navigation mock
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-[200vh]">
        <Story />
        <div className="p-8 mt-20">
          <p className="text-gray-500 text-sm">Scroll down to see the header shrink effect.</p>
        </div>
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Header>

export const Default: Story = {
  args: {
    attorneyCount: 0,
  },
}

export const WithAttorneyCount: Story = {
  args: {
    attorneyCount: 358742,
  },
}

export const SmallDirectory: Story = {
  args: {
    attorneyCount: 1250,
  },
}
