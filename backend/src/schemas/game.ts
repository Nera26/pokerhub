import { z } from 'zod';

const BaseAction = z.object({
  tableId: z.string(),
  playerId: z.string(),
});

export const PostBlindActionSchema = BaseAction.extend({
  type: z.literal('postBlind'),
  amount: z.number().int().positive(),
});

export const BetActionSchema = BaseAction.extend({
  type: z.literal('bet'),
  amount: z.number().int().positive(),
});

export const RaiseActionSchema = BaseAction.extend({
  type: z.literal('raise'),
  amount: z.number().int().positive(),
});

export const CallActionSchema = BaseAction.extend({
  type: z.literal('call'),
  amount: z.number().int().positive().optional(),
});

export const CheckActionSchema = BaseAction.extend({
  type: z.literal('check'),
});

export const FoldActionSchema = BaseAction.extend({
  type: z.literal('fold'),
});

export const NextActionSchema = z.object({
  type: z.literal('next'),
  tableId: z.string(),
});

export const GameActionSchema = z.discriminatedUnion('type', [
  PostBlindActionSchema,
  BetActionSchema,
  RaiseActionSchema,
  CallActionSchema,
  CheckActionSchema,
  FoldActionSchema,
  NextActionSchema,
]);

export type GameAction = z.infer<typeof GameActionSchema>;

