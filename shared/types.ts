import { z } from 'zod';

export const StatusResponseSchema = z.object({
  status: z.string(),
});
export type StatusResponse = z.infer<typeof StatusResponseSchema>;

export const LoginResponseSchema = z.object({
  token: z.string(),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const MessageResponseSchema = z.object({
  message: z.string(),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

export const TournamentInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  buyIn: z.number(),
  prizePool: z.number(),
  players: z.object({ current: z.number(), max: z.number() }),
  registered: z.boolean(),
});
export type TournamentInfo = z.infer<typeof TournamentInfoSchema>;

export const PrizeCalcRequestSchema = z.object({
  prizePool: z.number(),
  payouts: z.array(z.number()),
  options: z
    .object({
      bounty: z.number().optional(),
      pko: z.boolean().optional(),
      satelliteTicketValue: z.number().optional(),
    })
    .optional(),
});
export type PrizeCalcRequest = z.infer<typeof PrizeCalcRequestSchema>;

export const PrizeCalcResponseSchema = z.object({
  prizes: z.array(z.number()),
  bounty: z.number().optional(),
  pko: z.boolean().optional(),
  seats: z.number().optional(),
});
export type PrizeCalcResponse = z.infer<typeof PrizeCalcResponseSchema>;
