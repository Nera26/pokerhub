import { z } from 'zod';

export const CreateUserSchema = z.object({
  username: z.string(),
  avatarKey: z.string().optional(),
});
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  username: z.string().optional(),
  avatarKey: z.string().optional(),
});
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;

export const BanUserSchema = z.object({
  reason: z.string().optional(),
});
export type BanUserRequest = z.infer<typeof BanUserSchema>;

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatarKey: z.string().optional(),
  banned: z.boolean(),
});
export type User = z.infer<typeof UserSchema>;

export const UserProfileSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  avatarUrl: z.string(),
  bank: z.string(),
  location: z.string(),
  joined: z.string().datetime(),
  bio: z.string(),
  experience: z.number(),
  balance: z.number(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

