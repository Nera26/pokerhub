import type { Meta, StoryObj } from '@storybook/react';
import SmoothButton from './SmoothButton';

const meta: Meta<typeof SmoothButton> = {
  title: 'UI/SmoothButton',
  component: SmoothButton,
  parameters: {
    docs: {
      description: {
        component:
          'Button with smooth hover and tap transitions using Framer Motion.',
      },
    },
  },
  argTypes: {
    children: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof SmoothButton>;

export const Default: Story = {
  args: { children: 'Play' },
};
