import { z } from 'zod';
import { GameTypeSchema } from '@shared/types';

export { GameTypeSchema };

export const GameTypeListSchema = z.array(GameTypeSchema);
export type GameTypeList = z.infer<typeof GameTypeListSchema>;
