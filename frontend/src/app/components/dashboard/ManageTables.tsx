'use client';

import {
  fetchTables,
  createTable,
  updateTable,
  deleteTable,
} from '@/lib/api/table';
import type {
  Table,
  CreateTableRequest,
  UpdateTableRequest,
} from '@shared/types';
import { CreateTableSchema, UpdateTableSchema } from '@shared/types';
import AdminCrudPage from './common/AdminCrudPage';
import { TableCell, TableHead, TableRow } from '../ui/Table';
import Button from '../ui/Button';
import TableModal from '../modals/TableModal';

export default function ManageTables() {
  return (
    <AdminCrudPage<
      Table,
      CreateTableRequest,
      { id: string; body: UpdateTableRequest },
      string
    >
      crudConfig={{
        queryKey: ['tables'],
        fetchItems: () => fetchTables(),
        getItemId: (table) => table.id,
        create: {
          mutationFn: createTable,
          parse: (values) => CreateTableSchema.parse(values),
        },
        update: {
          mutationFn: ({ id, body }) => updateTable(id, body),
          parse: ({ id, body }) => ({
            id,
            body: UpdateTableSchema.parse(body),
          }),
        },
        remove: {
          mutationFn: deleteTable,
        },
        table: {
          header: (
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Stakes</TableHead>
              <TableHead>Players</TableHead>
              <TableHead />
            </TableRow>
          ),
          renderRow: (table, { openEdit, deleteItem }) => (
            <TableRow key={table.id}>
              <TableCell>{table.tableName}</TableCell>
              <TableCell>{`$${table.stakes.small}/${table.stakes.big}`}</TableCell>
              <TableCell>
                {table.players.current}/{table.players.max}
              </TableCell>
              <TableCell className="space-x-2">
                <Button variant="secondary" onClick={() => openEdit(table)}>
                  Update
                </Button>
                <Button variant="danger" onClick={() => deleteItem(table)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ),
          searchFilter: (table, query) =>
            table.tableName.toLowerCase().includes(query),
        },
        translationKeys: {
          emptyMessage: 'noTablesFound',
          searchPlaceholder: 'searchTables',
        },
        errorMessages: {
          create: 'Failed to create table',
          update: 'Failed to update table',
        },
      }}
      className="space-y-4"
      loadingState={<div>Loading tables...</div>}
      errorState={<div>Error loading tables</div>}
      primaryAction={{ label: 'Create Table' }}
      renderModals={({ table }) => {
        if (!table) {
          return null;
        }

        const { modals, actions, formError } = table;
        const selected = modals.selected;
        const isEditMode = modals.mode === 'edit';

        return (
          <TableModal
            isOpen={modals.isCreateOpen || modals.isEditOpen}
            onClose={modals.close}
            onSubmit={(values) => {
              if (isEditMode && selected) {
                actions.submitUpdate({ id: selected.id, body: values });
              } else {
                actions.submitCreate(values);
              }
            }}
            title={isEditMode ? 'Edit Table' : 'Create Table'}
            submitLabel={isEditMode ? 'Update Table' : 'Create Table'}
            defaultValues={
              isEditMode && selected
                ? {
                    tableName: selected.tableName,
                    gameType: selected.gameType,
                    stakes: selected.stakes,
                    startingStack: selected.startingStack,
                    players: { max: selected.players.max },
                    buyIn: selected.buyIn,
                  }
                : undefined
            }
            error={formError}
          />
        );
      }}
    />
  );
}
