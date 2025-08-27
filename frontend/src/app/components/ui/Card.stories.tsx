import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

interface CardStoryProps {
  title: string;
  content: string;
}

const meta: Meta<CardStoryProps> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          'Container component with header, title, and content subcomponents.',
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    content: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<CardStoryProps>;

export const Default: Story = {
  render: ({ title, content }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  ),
  args: { title: 'Example', content: 'Body content' },
};
