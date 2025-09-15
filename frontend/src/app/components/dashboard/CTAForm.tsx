'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { CTASchema, CTAVariantSchema, type CTA } from '@shared/types';
import { createCTA, updateCTA } from '@/lib/api/lobby';
import type { ApiError } from '@/lib/api/client';
import Button from '../ui/Button';
import { TextField, SelectField } from './forms/fields';

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
      <TextField
        id="cta-id"
        label="ID"
        name="id"
        disabled={!!cta}
        register={register}
        errors={errors}
      />
      <TextField
        id="cta-label"
        label="Label"
        name="label"
        register={register}
        errors={errors}
      />
      <TextField
        id="cta-href"
        label="Href"
        name="href"
        register={register}
        errors={errors}
      />
      <SelectField
        id="cta-variant"
        label="Variant"
        name="variant"
        register={register}
        errors={errors}
        options={variants.map((v) => ({ value: v, label: v }))}
        defaultValue={cta?.variant}
      />
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
