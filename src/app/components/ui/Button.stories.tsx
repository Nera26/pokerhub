import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'Accessible button supporting variants, sizes, and icon-only usage with required aria-label.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'outline',
        'danger',
        'ghost',
        'secondary',
        'chipBlue',
        'chipYellow',
      ],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    fullWidth: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: 'Click me', variant: 'primary' },
};

export const Outline: Story = {
  args: { children: 'Outline', variant: 'outline' },
};

export const ChipBlue: Story = {
  args: { children: 'Chip Blue', variant: 'chipBlue' },
};

export const ChipYellow: Story = {
  args: { children: 'Chip Yellow', variant: 'chipYellow' },
};
