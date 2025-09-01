import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = LoginRequestSchema;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginResponseSchema = z.object({
  token: z.string(),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const MessageResponseSchema = z.object({
  message: z.string(),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

export const RefreshRequestSchema = z.object({
  refreshToken: z.string(),
});
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

export const RequestResetSchema = z.object({
  email: z.string().email(),
});
export type RequestResetRequest = z.infer<typeof RequestResetSchema>;
export const RequestResetResponseSchema = MessageResponseSchema;
export type RequestResetResponse = MessageResponse;

export const VerifyResetCodeSchema = z.object({
  email: z.string().email(),
  code: z.string(),
});
export type VerifyResetCodeRequest = z.infer<typeof VerifyResetCodeSchema>;
export const VerifyResetCodeResponseSchema = MessageResponseSchema;
export type VerifyResetCodeResponse = MessageResponse;

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string(),
  password: z.string(),
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;
export const ResetPasswordResponseSchema = MessageResponseSchema;
export type ResetPasswordResponse = MessageResponse;
