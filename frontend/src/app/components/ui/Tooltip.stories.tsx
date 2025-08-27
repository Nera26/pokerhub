import type { Meta, StoryObj } from '@storybook/react';
import Tooltip from './Tooltip';
import Button from './Button';

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component:
          'Shows informative text on hover or focus with role="tooltip".',
      },
    },
  },
  argTypes: {
    text: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    text: 'Helpful info',
    children: <Button>Hover me</Button>,
  },
};
