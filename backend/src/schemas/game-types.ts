import { z } from 'zod';

export const GameTypeSchema = z.enum(['texas', 'omaha', 'allin', 'tournaments']);
export type GameType = z.infer<typeof GameTypeSchema>;

export const GameTypeListSchema = z.array(GameTypeSchema);
export type GameTypeList = z.infer<typeof GameTypeListSchema>;
