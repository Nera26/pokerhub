import type { Meta, StoryObj } from '@storybook/react';
import ErrorBoundary from './ErrorBoundary';

interface ErrorBoundaryStoryProps {
  fallback: string;
  shouldThrow: boolean;
}

const meta: Meta<ErrorBoundaryStoryProps> = {
  title: 'UI/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    docs: {
      description: {
        component:
          'Catches JavaScript errors in child components and renders a fallback instead of crashing the app.',
      },
    },
  },
  argTypes: {
    fallback: { control: 'text' },
    shouldThrow: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<ErrorBoundaryStoryProps>;

const BuggyComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>All good here.</div>;
};

export const Default: Story = {
  render: ({ fallback, shouldThrow }) => (
    <ErrorBoundary fallback={<div>{fallback}</div>}>
      <BuggyComponent shouldThrow={shouldThrow} />
    </ErrorBoundary>
  ),
  args: { fallback: 'Something went wrong.', shouldThrow: true },
};
