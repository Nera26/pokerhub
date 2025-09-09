'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuthActions } from '@/app/store/authStore';
import { login, type ApiError } from '@/lib/api/auth';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .refine((val) => val.length >= 6, {
      message: 'Password must be at least 6 characters',
    }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setToken, clearToken } = useAuthActions();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const loginMutation = useMutation<
    Awaited<ReturnType<typeof login>>,
    unknown,
    LoginFormData,
    { previousToken: string | null }
  >({
    mutationFn: ({ email, password }: LoginFormData) => login(email, password),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['authToken'] });
      const previousToken =
        queryClient.getQueryData<string | null>(['authToken']) ?? null;
      const pendingToken = 'pending';
      setToken(pendingToken);
      queryClient.setQueryData(['authToken'], pendingToken);
      return { previousToken };
    },
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(['authToken'], data.token);
      router.push('/');
    },
    onError: (err: unknown, _vars, ctx) => {
      if (ctx?.previousToken) {
        setToken(ctx.previousToken);
        queryClient.setQueryData(['authToken'], ctx.previousToken);
      } else {
        clearToken();
        queryClient.setQueryData(['authToken'], null);
      }
      if (err && typeof err === 'object') {
        const apiErr = err as ApiError;
        let { message, errors: fieldErrors } = apiErr;

        if (!fieldErrors && typeof apiErr.details === 'string') {
          try {
            const parsed = JSON.parse(apiErr.details);
            if (parsed && typeof parsed === 'object') {
              if (!message && typeof parsed.message === 'string') {
                message = parsed.message;
              }
              if (parsed.errors && typeof parsed.errors === 'object') {
                fieldErrors = parsed.errors as Record<string, unknown>;
              }
            }
          } catch {
            // ignore JSON parsing errors
          }
        }

        if (fieldErrors && typeof fieldErrors.email === 'string') {
          setError('email', { message: fieldErrors.email });
        }
        if (fieldErrors && typeof fieldErrors.password === 'string') {
          setError('password', { message: fieldErrors.password });
        }
        setError('root', {
          message: typeof message === 'string' ? message : 'Login failed',
        });
      } else if (err instanceof Error) {
        setError('root', { message: err.message });
      } else {
        setError('root', { message: 'Login failed' });
      }
    },
  });

  const onSubmit = handleSubmit((data) => {
    setError('root', { message: '' });
    loginMutation.mutate(data);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Input
        id="login-email"
        type="email"
        label="Email Address"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        id="login-password"
        type="password"
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <div aria-live="polite">
        {errors.root?.message && (
          <p className="text-center text-danger-red text-sm">
            {errors.root?.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? 'Logging In…' : 'Login'}
      </Button>
    </form>
  );
}
