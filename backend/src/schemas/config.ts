import { z } from 'zod';

export const DefaultAvatarResponseSchema = z.object({
  defaultAvatar: z.string().url(),
});

export type DefaultAvatarResponse = z.infer<typeof DefaultAvatarResponseSchema>;
