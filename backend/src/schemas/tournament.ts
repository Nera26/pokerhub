import { z } from 'zod';

export const TournamentSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  buyIn: z.number(),
  currency: z.string().length(3),
  prizePool: z.number(),
  maxPlayers: z.number(),
  state: z.enum(['REG_OPEN', 'RUNNING', 'PAUSED', 'FINISHED', 'CANCELLED']),
});

export const TournamentListSchema = z.array(TournamentSchema);

export type Tournament = z.infer<typeof TournamentSchema>;
export type TournamentList = z.infer<typeof TournamentListSchema>;

export const TournamentDetailSchema = TournamentSchema.extend({
  players: z.object({ current: z.number(), max: z.number() }),
  registered: z.boolean(),
  registration: z.object({
    open: z.string().datetime().nullable(),
    close: z.string().datetime().nullable(),
  }),
});
export type TournamentDetail = z.infer<typeof TournamentDetailSchema>;

export const CalculatePrizesRequestSchema = z.object({
  prizePool: z.number().int().nonnegative(),
  payouts: z.array(z.number()).nonempty(),
  bountyPct: z.number().min(0).max(1).optional(),
  satelliteSeatCost: z.number().int().positive().optional(),
});

export const CalculatePrizesResponseSchema = z.object({
  prizes: z.array(z.number().int().nonnegative()),
  bountyPool: z.number().int().nonnegative().optional(),
  seats: z.number().int().nonnegative().optional(),
  remainder: z.number().int().nonnegative().optional(),
});

export type CalculatePrizesRequest = z.infer<
  typeof CalculatePrizesRequestSchema
>;
export type CalculatePrizesResponse = z.infer<
  typeof CalculatePrizesResponseSchema
>;

export const RegisterRequestSchema = z.object({});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const WithdrawRequestSchema = RegisterRequestSchema;

export type WithdrawRequest = z.infer<typeof WithdrawRequestSchema>;

export const TournamentScheduleRequestSchema = z.object({
  startTime: z.string().datetime(),
  registration: z.object({
    open: z.string().datetime(),
    close: z.string().datetime(),
  }),
  structure: z.array(
    z.object({
      level: z.number().int().positive(),
      durationMinutes: z.number().int().positive(),
    }),
  ),
  breaks: z
    .array(
      z.object({
        start: z.string().datetime(),
        durationMs: z.number().int().positive(),
      }),
    )
    .optional()
    .default([]),
});

export type TournamentScheduleRequest = z.infer<
  typeof TournamentScheduleRequestSchema
>;

export const HotPatchLevelRequestSchema = z.object({
  level: z.number().int().positive(),
  smallBlind: z.number().int().positive(),
  bigBlind: z.number().int().positive(),
});

export type HotPatchLevelRequest = z.infer<
  typeof HotPatchLevelRequestSchema
>;
