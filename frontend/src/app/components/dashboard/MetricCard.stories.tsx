import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { faUsers, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import MetricCard, { TimeFilter } from './MetricCard';

const meta: Meta<typeof MetricCard> = {
  title: 'Dashboard/MetricCard',
  component: MetricCard,
};
export default meta;

type Story = StoryObj<typeof MetricCard>;

export const Default: Story = {
  args: {
    title: 'Active Users',
    value: 123,
    icon: faUsers,
    valueClassName: 'text-accent-green',
    iconClassName: 'text-accent-green',
  },
};

export const WithFilter: Story = {
  render: () => {
    const [filter, setFilter] = useState<TimeFilter>('today');
    return (
      <MetricCard
        title="Revenue"
        value="$1,234"
        icon={faDollarSign}
        valueClassName="text-accent-yellow"
        iconClassName="text-accent-yellow"
        subtext="+5%"
        filter={{ value: filter, onChange: setFilter }}
      />
    );
  },
};

