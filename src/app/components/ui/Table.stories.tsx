import type { Meta, StoryObj } from '@storybook/react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from './Table';

const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
  parameters: {
    docs: {
      description: {
        component:
          'Set of table primitives with consistent styling and accessible markup.',
      },
    },
  },
  argTypes: {
    className: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: (args) => (
    <Table {...args}>
      <TableHeader>
        <TableRow>
          <TableHead>Player</TableHead>
          <TableHead>Chips</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Alice</TableCell>
          <TableCell>1200</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Bob</TableCell>
          <TableCell>800</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  args: { className: '' },
};
