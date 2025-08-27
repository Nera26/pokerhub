import type { Meta, StoryObj } from '@storybook/react';
import PlayerChipStack from './PlayerChipStack';

const meta: Meta<typeof PlayerChipStack> = {
  title: 'UI/PlayerChipStack',
  component: PlayerChipStack,
  parameters: {
    docs: {
      description: {
        component:
          'Animated chip stack showing amount changes with win/lose feedback.',
      },
    },
  },
  argTypes: {
    amount: { control: 'number' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};
export default meta;
type Story = StoryObj<typeof PlayerChipStack>;

export const Default: Story = {
  args: { amount: 2500 },
};
