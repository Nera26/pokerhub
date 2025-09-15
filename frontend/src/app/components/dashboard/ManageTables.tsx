'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useTranslations } from '@/hooks/useTranslations';
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
import { CreateTableSchema } from '@shared/types';
import { Button } from '../ui/Button';
import { TableCell, TableHead, TableRow } from '../ui/Table';
import TableModal from '../modals/TableModal';
import AdminTableManager from './common/AdminTableManager';

export default function ManageTables() {
  const queryClient = useQueryClient();
  const locale = useLocale();
  const { data: t } = useTranslations(locale);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const {
    data: tables = [],
    isLoading,
    error,
  } = useQuery<Table[]>({
    queryKey: ['tables'],
    queryFn: () => fetchTables(),
  });

  const create = useMutation({
    mutationFn: (body: CreateTableRequest) => createTable(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setIsModalOpen(false);
    },
    onError: () => setModalError('Failed to create table'),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTableRequest }) =>
      updateTable(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setIsModalOpen(false);
    },
    onError: () => setModalError('Failed to update table'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  });

  const openCreateModal = () => {
    setEditingTable(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Table) => {
    setEditingTable(t);
    setModalError(null);
    setIsModalOpen(true);
  };

  const submitTable = (values: CreateTableRequest) => {
    const parsed = CreateTableSchema.parse(values);
    if (editingTable) {
      update.mutate({ id: editingTable.id, body: parsed });
    } else {
      create.mutate(parsed);
    }
  };

  if (isLoading) {
    return <div>Loading tables...</div>;
  }

  if (error) {
    return <div>Error loading tables</div>;
  }

  return (
    <div className="space-y-4">
      <Button onClick={openCreateModal}>Create Table</Button>

      <AdminTableManager
        items={tables}
        header={
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Stakes</TableHead>
            <TableHead>Players</TableHead>
            <TableHead />
          </TableRow>
        }
        renderRow={(t) => (
          <TableRow key={t.id}>
            <TableCell>{t.tableName}</TableCell>
            <TableCell>{`$${t.stakes.small}/${t.stakes.big}`}</TableCell>
            <TableCell>
              {t.players.current}/{t.players.max}
            </TableCell>
            <TableCell className="space-x-2">
              <Button variant="secondary" onClick={() => openEditModal(t)}>
                Update
              </Button>
              <Button variant="danger" onClick={() => remove.mutate(t.id)}>
                Delete
              </Button>
            </TableCell>
          </TableRow>
        )}
        searchFilter={(t, q) => t.tableName.toLowerCase().includes(q)}
        emptyMessage={t?.noTablesFound ?? 'No tables found'}
      />

      <TableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={submitTable}
        title={editingTable ? 'Edit Table' : 'Create Table'}
        submitLabel={editingTable ? 'Update Table' : 'Create Table'}
        defaultValues={
          editingTable
            ? {
                tableName: editingTable.tableName,
                gameType: editingTable.gameType,
                stakes: editingTable.stakes,
                startingStack: 100,
                players: { max: editingTable.players.max },
                buyIn: editingTable.buyIn,
              }
            : undefined
        }
        error={modalError}
      />
    </div>
  );
}
