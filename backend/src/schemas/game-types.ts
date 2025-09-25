import { z } from 'zod';

export const GameTypeSchema = z.enum([
  'texas',
  'omaha',
  'allin',
  'tournaments',
]);
export type GameType = z.infer<typeof GameTypeSchema>;

export const GameTypeWithLabelSchema = z.object({
  id: GameTypeSchema,
  label: z.string(),
});
export type GameTypeWithLabel = z.infer<typeof GameTypeWithLabelSchema>;

export const GameTypeListSchema = z.array(GameTypeWithLabelSchema);
export type GameTypeList = z.infer<typeof GameTypeListSchema>;

