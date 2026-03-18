import type { Meta, StoryObj } from '@storybook/react'
import { Award } from 'lucide-react'
import Badge, { StatusBadge, SlotBadge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'neutral'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    dot: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
  args: {
    children: 'Badge',
    variant: 'neutral',
    size: 'md',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="neutral">Neutral</Badge>
    </div>
  ),
}

export const WithDot: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Badge variant="success" dot>Active</Badge>
      <Badge variant="warning" dot>Pending</Badge>
      <Badge variant="error" dot>Inactive</Badge>
    </div>
  ),
}

export const WithIcon: Story = {
  args: {
    children: 'Top Rated',
    variant: 'warning',
    icon: <Award className="w-3.5 h-3.5" />,
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Badge variant="primary" size="sm">Small</Badge>
      <Badge variant="primary" size="md">Medium</Badge>
      <Badge variant="primary" size="lg">Large</Badge>
    </div>
  ),
}

export const BookingStatuses: Story = {
  name: 'StatusBadge (Booking Statuses)',
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <StatusBadge status="confirmed" />
      <StatusBadge status="pending" />
      <StatusBadge status="cancelled" />
      <StatusBadge status="completed" />
      <StatusBadge status="no_show" />
    </div>
  ),
}

export const SlotTypes: Story = {
  name: 'SlotBadge (Availability)',
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <SlotBadge type="popular" />
      <SlotBadge type="recommended" />
      <SlotBadge type="last_minute" />
      <SlotBadge type="available" />
    </div>
  ),
}
