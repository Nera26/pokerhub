import type { Meta, StoryObj } from '@storybook/react';
import ToastNotification from './ToastNotification';

const meta: Meta<typeof ToastNotification> = {
  title: 'UI/ToastNotification',
  component: ToastNotification,
  parameters: {
    docs: {
      description: {
        component:
          'Transient message displayed at the top center. Uses `role="status"` or `role="alert"` depending on type.',
      },
    },
  },
  argTypes: {
    type: { control: 'select', options: ['success', 'error'] },
    duration: { control: 'number' },
  },
};
export default meta;
type Story = StoryObj<typeof ToastNotification>;

export const Success: Story = {
  args: { message: 'Saved!', type: 'success', isOpen: true, onClose: () => {} },
};

export const Error: Story = {
  args: { message: 'Oops!', type: 'error', isOpen: true, onClose: () => {} },
};
