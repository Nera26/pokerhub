import type { Meta, StoryObj } from '@storybook/react';
import TopProgressBar from './TopProgressBar';

const meta: Meta<typeof TopProgressBar> = {
  title: 'UI/TopProgressBar',
  component: TopProgressBar,
  parameters: {
    docs: {
      description: {
        component:
          'Displays a route-change progress bar at the top of the viewport using `nextjs-toploader`.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof TopProgressBar>;

export const Default: Story = {
  render: () => <TopProgressBar />,
  parameters: { controls: { hideNoControlsWarning: true } },
};
