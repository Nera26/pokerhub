'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Button } from '../ui/Button';
import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/Table';

export default function ManageTables() {
  const queryClient = useQueryClient();
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTableRequest }) =>
      updateTable(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  });

  if (isLoading) {
    return <div>Loading tables...</div>;
  }

  if (error) {
    return <div>Error loading tables</div>;
  }

  if (tables.length === 0) {
    return (
      <div className="space-y-4">
        <p>No tables found</p>
        <Button
          onClick={() =>
            create.mutate({
              tableName: 'New Table',
              gameType: 'texas',
              stakes: { small: 1, big: 2 },
              startingStack: 100,
              players: { max: 9 },
              buyIn: { min: 50, max: 500 },
            })
          }
        >
          Create Table
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() =>
          create.mutate({
            tableName: 'New Table',
            gameType: 'texas',
            stakes: { small: 1, big: 2 },
            startingStack: 100,
            players: { max: 9 },
            buyIn: { min: 50, max: 500 },
          })
        }
      >
        Add Table
      </Button>

      <UiTable>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Stakes</TableHead>
            <TableHead>Players</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tables.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.tableName}</TableCell>
              <TableCell>{`$${t.stakes.small}/${t.stakes.big}`}</TableCell>
              <TableCell>
                {t.players.current}/{t.players.max}
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    update.mutate({
                      id: t.id,
                      body: { tableName: t.tableName },
                    })
                  }
                >
                  Update
                </Button>
                <Button variant="danger" onClick={() => remove.mutate(t.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </UiTable>
    </div>
  );
}

