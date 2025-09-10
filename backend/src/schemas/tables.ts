import { z } from 'zod';
import { GameTypeSchema } from './game-types';

export const TableSchema = z.object({
  id: z.string(),
  tableName: z.string(),
  gameType: GameTypeSchema,
  stakes: z.object({ small: z.number(), big: z.number() }),
  players: z.object({ current: z.number(), max: z.number() }),
  buyIn: z.object({ min: z.number(), max: z.number() }),
  stats: z.object({
    handsPerHour: z.number(),
    avgPot: z.number(),
    rake: z.number(),
  }),
  createdAgo: z.string(),
});
export type Table = z.infer<typeof TableSchema>;

export const TableListSchema = z.array(TableSchema);
export type TableList = z.infer<typeof TableListSchema>;

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

export const PlayerSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatar: z.string(),
  chips: z.number(),
  committed: z.number().optional(),
  isActive: z.boolean().optional(),
  isFolded: z.boolean().optional(),
  sittingOut: z.boolean().optional(),
  isAllIn: z.boolean().optional(),
  isWinner: z.boolean().optional(),
  timeLeft: z.number().optional(),
  cards: z.tuple([z.string(), z.string()]).optional(),
  pos: z.string().optional(),
  lastAction: z.string().optional(),
});
export type Player = z.infer<typeof PlayerSchema>;

export const ChatMessageSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatar: z.string(),
  text: z.string(),
  time: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const SendChatMessageRequestSchema = z.object({
  userId: z.string(),
  text: z.string(),
});
export type SendChatMessageRequest = z.infer<typeof SendChatMessageRequestSchema>;

export const TableDataSchema = z.object({
  smallBlind: z.number(),
  bigBlind: z.number(),
  pot: z.number(),
  communityCards: z.array(z.string()),
  players: z.array(PlayerSchema),
  chatMessages: z.array(ChatMessageSchema),
  stateAvailable: z.boolean(),
});
export type TableData = z.infer<typeof TableDataSchema>;

export const TableListQuerySchema = z.object({
  status: z.enum(['active']).optional(),
});
export type TableListQuery = z.infer<typeof TableListQuerySchema>;
