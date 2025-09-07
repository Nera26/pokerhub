'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { CTASchema, CTAVariantSchema, type CTA } from '@shared/types';
import { createCTA, updateCTA } from '@/lib/api/lobby';
import type { ApiError } from '@/lib/api/client';
import Input from '../ui/Input';
import Button from '../ui/Button';

const schema = CTASchema;
export type CTAFormValues = z.infer<typeof schema>;
const variants = CTAVariantSchema.options;

interface CTAFormProps {
  cta?: CTA;
  onSuccess?: (cta: CTA) => void;
}

export default function CTAForm({ cta, onSuccess }: CTAFormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CTAFormValues>({
    resolver: zodResolver(schema),
    defaultValues: cta ?? { id: '', label: '', href: '', variant: 'primary' },
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: CTAFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = cta
        ? await updateCTA(cta.id, values)
        : await createCTA(values);
      await queryClient.invalidateQueries({ queryKey: ['ctas'] });
      onSuccess?.(result);
      reset(result);
    } catch (e) {
      const err = e as ApiError;
      setError(err.message || 'Failed to submit CTA');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <Input
        id="cta-id"
        label="ID"
        disabled={!!cta}
        error={errors.id?.message}
        {...register('id')}
      />
      <Input
        id="cta-label"
        label="Label"
        error={errors.label?.message}
        {...register('label')}
      />
      <Input
        id="cta-href"
        label="Href"
        error={errors.href?.message}
        {...register('href')}
      />
      <div>
        <label htmlFor="cta-variant" className="block text-sm font-semibold mb-2">
          Variant
        </label>
        <select
          id="cta-variant"
          className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none"
          defaultValue={cta?.variant}
          {...register('variant')}
        >
          {variants.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        {errors.variant && (
          <p className="text-xs text-danger-red mt-1">{errors.variant.message}</p>
        )}
      </div>
      {error && (
        <p role="alert" className="text-danger-red text-sm">
          {error}
        </p>
      )}
      <Button type="submit" fullWidth loading={submitting}>
        Save CTA
      </Button>
    </form>
  );
}

