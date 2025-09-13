import { z } from 'zod';

export const TournamentFormatSchema = z.enum([
  'Regular',
  'Turbo',
  'Deepstack',
  'Bounty',
  'Freeroll',
]);

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

export const TournamentFormatsResponseSchema = z.array(TournamentFormatSchema);
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
