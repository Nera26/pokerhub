import type { Meta, StoryObj } from '@storybook/react';
import LinkButton from './LinkButton';

const meta: Meta<typeof LinkButton> = {
  title: 'UI/LinkButton',
  component: LinkButton,
  parameters: {
    docs: {
      description: {
        component:
          'Navigational button that prefetches and pushes routes using Next.js router.',
      },
    },
  },
  argTypes: {
    href: { control: 'text' },
    children: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof LinkButton>;

export const Default: Story = {
  args: { href: '/', children: 'Home' },
};
