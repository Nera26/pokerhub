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

export const BalanceAdjustmentSchema = z.object({
  amount: z.number(),
});
export type BalanceAdjustmentRequest = z.infer<typeof BalanceAdjustmentSchema>;

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatarKey: z.string().optional(),
  banned: z.boolean(),
  balance: z.number(),
});
export type User = z.infer<typeof UserSchema>;

