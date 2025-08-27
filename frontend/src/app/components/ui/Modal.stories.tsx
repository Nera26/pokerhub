import type { Meta, StoryObj } from '@storybook/react';
import Modal from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    docs: {
      description: {
        component:
          'Focus-trapping modal dialog that closes on overlay click or Escape key.',
      },
    },
  },
  argTypes: {
    isOpen: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    children: <div>Modal content</div>,
  },
};
