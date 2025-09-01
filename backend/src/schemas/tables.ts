import { z } from 'zod';
import { TableSchema, GameTypeSchema } from '@shared/types';

export const CreateTableSchema = z.object({
  tableName: z.string(),
  gameType: GameTypeSchema,
  stakes: z.object({ small: z.number(), big: z.number() }),
  startingStack: z.number(),
  players: z.object({ max: z.number() }),
  buyIn: z.object({ min: z.number(), max: z.number() }),
});
export type CreateTableRequest = z.infer<typeof CreateTableSchema>;

export const UpdateTableSchema = CreateTableSchema.partial();
export type UpdateTableRequest = z.infer<typeof UpdateTableSchema>;

export { TableSchema };
export const TableListSchema = z.array(TableSchema);
export type Table = z.infer<typeof TableSchema>;
export type TableList = z.infer<typeof TableListSchema>;
