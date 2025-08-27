import type { Meta, StoryObj } from '@storybook/react';
import Input from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    docs: {
      description: {
        component:
          'Text input with optional label and error message for accessibility. When using `label` or `error`, an `id` is required.',
      },
    },
  },
  argTypes: {
    fullWidth: { control: 'boolean' },
    error: { control: 'text' },
    label: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { id: 'username', label: 'Username', placeholder: 'Enter name' },
};
