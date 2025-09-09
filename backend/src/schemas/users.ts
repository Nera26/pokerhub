import { z } from 'zod';

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

export const MeResponseSchema = z.object({
  avatarUrl: z.string(),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

export const ProfileStatsResponseSchema = z.object({
  handsPlayed: z.number(),
  winRate: z.number(),
  tournamentsPlayed: z.number(),
  topThreeRate: z.number(),
});
export type ProfileStatsResponse = z.infer<
  typeof ProfileStatsResponseSchema
>;
