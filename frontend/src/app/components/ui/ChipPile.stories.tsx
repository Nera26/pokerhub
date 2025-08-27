import type { Meta, StoryObj } from '@storybook/react';
import ChipPile from './ChipPile';

const meta: Meta<typeof ChipPile> = {
  title: 'UI/ChipPile',
  component: ChipPile,
  parameters: {
    docs: {
      description: {
        component:
          'Compact stack of poker chips with optional drop shadow when grounded. Mark decorative piles aria-hidden to avoid distracting screen readers.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    grounded: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof ChipPile>;

export const Default: Story = {
  args: { amount: 1500 },
};
