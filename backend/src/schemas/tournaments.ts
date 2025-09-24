import { z } from 'zod';
import { GameTypeSchema } from './game-types';

export const TournamentFormatSchema = z.string().min(1);
export type TournamentFormat = z.infer<typeof TournamentFormatSchema>;

export const TournamentFormatOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});
export type TournamentFormatOption = z.infer<
  typeof TournamentFormatOptionSchema
>;

export const AdminTournamentSchema = z.object({
  id: z.number(),
  name: z.string(),
  gameType: z.string(),
  buyin: z.number(),
  fee: z.number(),
  prizePool: z.number(),
  date: z.string(),
  time: z.string(),
  format: TournamentFormatSchema,
  seatCap: z.union([z.number().int().positive(), z.literal('')]).optional(),
  description: z.string().optional(),
  rebuy: z.boolean(),
  addon: z.boolean(),
  status: z.enum(['scheduled', 'running', 'finished', 'cancelled', 'auto-start']),
});

export type AdminTournament = z.infer<typeof AdminTournamentSchema>;

export const TournamentFormatsResponseSchema = z.array(
  TournamentFormatOptionSchema,
);
export type TournamentFormatsResponse = z.infer<
  typeof TournamentFormatsResponseSchema
>;

export const TournamentFilterSchema = z.enum([
  'active',
  'upcoming',
  'past',
]);
export type TournamentFilter = z.infer<typeof TournamentFilterSchema>;

export const TournamentFilterOptionSchema = z.object({
  label: z.string(),
  value: TournamentFilterSchema,
});
export type TournamentFilterOption = z.infer<typeof TournamentFilterOptionSchema>;

export const TournamentFiltersResponseSchema = z.array(
  TournamentFilterOptionSchema,
);
export type TournamentFiltersResponse = z.infer<
  typeof TournamentFiltersResponseSchema
>;

export const TournamentSimulateRequestSchema = z.object({
  levels: z.number().int().positive(),
  levelMinutes: z.number().int().positive(),
  increment: z.number().positive(),
  entrants: z.number().int().positive(),
  runs: z.number().int().positive(),
});
export type TournamentSimulateRequest = z.infer<
  typeof TournamentSimulateRequestSchema
>;

export const TournamentSimulateResponseSchema = z.object({
  averageDuration: z.number(),
  durationVariance: z.number(),
});
export type TournamentSimulateResponse = z.infer<
  typeof TournamentSimulateResponseSchema
>;

export const TournamentStateSchema = z.enum([
  'REG_OPEN',
  'RUNNING',
  'PAUSED',
  'FINISHED',
  'CANCELLED',
]);
export type TournamentState = z.infer<typeof TournamentStateSchema>;

export const TournamentStatusSchema = z.enum(['upcoming', 'running', 'past']);
export type TournamentStatus = z.infer<typeof TournamentStatusSchema>;

export const TournamentStateMap: Record<
  TournamentState,
  TournamentStatus
> = {
  REG_OPEN: 'upcoming',
  RUNNING: 'running',
  PAUSED: 'running',
  FINISHED: 'past',
  CANCELLED: 'past',
};

export const TournamentSchema = z.object({
  id: z.string(),
  title: z.string(),
  gameType: GameTypeSchema,
  buyIn: z.number(),
  fee: z.number().optional(),
  prizePool: z.number(),
  state: TournamentStateSchema,
  players: z.object({ current: z.number(), max: z.number() }),
  registered: z.boolean(),
});
export type Tournament = z.infer<typeof TournamentSchema>;

const TournamentInfoSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const TournamentDetailsSchema = TournamentSchema.extend({
  registration: z.object({
    open: z.string().datetime().nullable(),
    close: z.string().datetime().nullable(),
  }),
  overview: z.array(TournamentInfoSchema),
  structure: z.array(TournamentInfoSchema),
  prizes: z.array(TournamentInfoSchema),
});
export type TournamentDetails = z.infer<typeof TournamentDetailsSchema>;
