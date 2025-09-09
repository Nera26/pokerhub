'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Input from '../ui/Input';
import Button from '../ui/Button';
import {
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
  type ApiError,
} from '@/lib/api/auth';

export interface ForgotPasswordFormProps {
  /** Called when user wants to cancel and go back to login */
  onBack?: () => void;
}

function parseApiError(err: ApiError) {
  let { message, errors } = err;
  if (!errors && typeof err.details === 'string') {
    try {
      const parsed = JSON.parse(err.details);
      if (parsed && typeof parsed === 'object') {
        if (!message && typeof parsed.message === 'string') {
          message = parsed.message;
        }
        if (parsed.errors && typeof parsed.errors === 'object') {
          errors = parsed.errors as Record<string, unknown>;
        }
      }
    } catch {
      // ignore JSON parse errors
    }
  }
  return { message, errors } as {
    message?: string;
    errors?: Record<string, unknown>;
  };
}

export default function ForgotPasswordForm({
  onBack,
}: ForgotPasswordFormProps) {
  const queryClient = useQueryClient();

  const step1Schema = z.object({
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Invalid email address'),
  });

  const step2Schema = z.object({
    code: z
      .string()
      .trim()
      .min(1, 'Code is required')
      .regex(/^\d{6}$/, 'Code must be 6 digits'),
  });

  const step3Schema = z
    .object({
      newPassword: z
        .string()
        .min(1, 'Password is required')
        .refine((val) => val.length >= 6, {
          message: 'Password must be at least 6 characters',
        }),
      confirmPassword: z.string().min(1, 'Please confirm password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    });

  type FormValues = {
    step: 1 | 2 | 3;
    email: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
    formStatus: string;
  };

  const methods = useForm<FormValues>({
    defaultValues: {
      step: 1,
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: '',
      formStatus: '',
    },
    shouldUnregister: false,
    resolver: async (values, context, options) => {
      let schema: z.ZodTypeAny = step1Schema;
      if (values.step === 2) schema = step2Schema;
      if (values.step === 3) schema = step3Schema;
      return zodResolver(schema)(values, context, options);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    watch,
  } = methods;

  const step = watch('step');
  const formStatus = watch('formStatus');

  const requestResetMutation = useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
    onMutate: async () => {
      const previous = formStatus;
      setValue('formStatus', 'Verification code sent to your email.');
      setValue('step', 2);
      return previous;
    },
    onError: (err: unknown, _email, context) => {
      setValue('step', 1);
      setValue('formStatus', (context as string) || '');
      if (err && typeof err === 'object') {
        const { message, errors } = parseApiError(err as ApiError);
        setError('email', {
          message:
            (typeof errors?.email === 'string' ? errors.email : undefined) ||
            message ||
            'Failed to send code',
        });
      } else if (err instanceof Error) {
        setError('email', { message: err.message });
      } else {
        setError('email', { message: 'Failed to send code' });
      }
    },
    onSuccess: (data) => {
      setValue(
        'formStatus',
        data.message || 'Verification code sent to your email.',
      );
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      verifyResetCode(email, code),
    onMutate: async () => {
      const previous = formStatus;
      setValue('formStatus', 'Code verified successfully.');
      setValue('step', 3);
      return previous;
    },
    onError: (err: unknown, _variables, context) => {
      setValue('step', 2);
      setValue('formStatus', (context as string) || '');
      if (err && typeof err === 'object') {
        const { message, errors } = parseApiError(err as ApiError);
        setError('code', {
          message:
            (typeof errors?.code === 'string' ? errors.code : undefined) ||
            message ||
            'Invalid or expired code',
        });
      } else if (err instanceof Error) {
        setError('code', { message: err.message });
      } else {
        setError('code', { message: 'Invalid or expired code' });
      }
    },
    onSuccess: (data) => {
      setValue('formStatus', data.message || 'Code verified successfully.');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({
      email,
      code,
      newPassword,
    }: {
      email: string;
      code: string;
      newPassword: string;
    }) => resetPassword(email, code, newPassword),
    onMutate: async () => {
      const previous = formStatus;
      setValue('formStatus', 'Password reset successfully.');
      return previous;
    },
    onError: (err: unknown, _variables, context) => {
      setValue('formStatus', (context as string) || '');
      if (err && typeof err === 'object') {
        const { message, errors } = parseApiError(err as ApiError);
        if (typeof errors?.password === 'string') {
          setError('newPassword', { message: errors.password });
        }
        setValue('formStatus', message || 'Failed to reset password');
      } else if (err instanceof Error) {
        setValue('formStatus', err.message);
      } else {
        setValue('formStatus', 'Failed to reset password');
      }
    },
    onSuccess: (data) => {
      setValue('formStatus', data.message || 'Password reset successfully.');
      queryClient.invalidateQueries({ queryKey: ['authToken'] });
    },
  });

  const submitEmail = handleSubmit(({ email }) =>
    requestResetMutation.mutate(email),
  );

  const submitCode = handleSubmit(({ email, code }) =>
    verifyCodeMutation.mutate({ email, code }),
  );

  const submitReset = handleSubmit(({ email, code, newPassword }) =>
    resetPasswordMutation.mutate({ email, code, newPassword }),
  );

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        {step === 1 && (
          <form onSubmit={submitEmail} className="wizard-step" noValidate>
            <Input
              id="reset-email"
              label="Email Address"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Button
              type="submit"
              disabled={requestResetMutation.isPending}
              className="w-full"
            >
              {requestResetMutation.isPending ? 'Sending...' : 'Send Code'}
            </Button>
            {formStatus && (
              <p className="text-accent-green text-center text-sm">
                {formStatus}
              </p>
            )}
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitCode} className="wizard-step" noValidate>
            <Input
              id="reset-code"
              label="Enter 6-digit Code"
              type="text"
              maxLength={6}
              inputMode="numeric"
              pattern="\\d*"
              error={errors.code?.message}
              {...register('code')}
            />
            <Button
              type="submit"
              disabled={verifyCodeMutation.isPending}
              className="w-full"
            >
              {verifyCodeMutation.isPending ? 'Verifying...' : 'Verify Code'}
            </Button>
            {formStatus && (
              <p className="text-accent-green text-center text-sm">
                {formStatus}
              </p>
            )}
          </form>
        )}

        {step === 3 && (
          <form onSubmit={submitReset} className="wizard-step" noValidate>
            <Input
              id="new-password"
              label="New Password"
              type="password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <Input
              id="confirm-password"
              label="Confirm Password"
              type="password"
              autoComplete="confirm-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full"
            >
              {resetPasswordMutation.isPending
                ? 'Resetting...'
                : 'Reset Password'}
            </Button>
            {formStatus && (
              <p className="text-accent-green text-center text-sm">
                {formStatus}
              </p>
            )}
          </form>
        )}

        <div className="text-center mt-4">
          <button
            className="text-accent-yellow text-sm hover:underline"
            onClick={() => onBack?.()}
          >
            Back to Login
          </button>
        </div>
      </div>
    </FormProvider>
  );
}
