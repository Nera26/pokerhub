import type { Meta, StoryObj } from '@storybook/react';
import Avatar from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    docs: {
      description: {
        component:
          'Displays user initials in a circular badge with an accessible aria-label.',
      },
    },
  },
  argTypes: {
    name: { control: 'text' },
    size: { control: { type: 'number', min: 16, step: 4 } },
  },
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: { name: 'Nelly', size: 28 },
};
