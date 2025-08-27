import { z } from 'zod';

export const LeaderboardResponseSchema = z.array(z.string());

export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;
