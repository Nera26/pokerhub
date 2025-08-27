import type { Meta, StoryObj } from '@storybook/react';
import InlineError from './InlineError';

const meta: Meta<typeof InlineError> = {
  title: 'UI/InlineError',
  component: InlineError,
  parameters: {
    docs: {
      description: {
        component:
          'Displays an inline error message with role="alert" for assistive technologies.',
      },
    },
  },
  argTypes: {
    message: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof InlineError>;

export const Default: Story = {
  args: { message: 'Something went wrong' },
};
