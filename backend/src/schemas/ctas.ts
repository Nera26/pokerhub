import { z } from 'zod';

export const CTAVariantSchema = z.enum([
  'primary',
  'outline',
  'danger',
  'ghost',
  'secondary',
  'chipBlue',
  'chipYellow',
]);

export const CTASchema = z.object({
  id: z.string(),
  label: z.string(),
  href: z.string(),
  variant: CTAVariantSchema,
});

export const CTAsResponseSchema = z.array(CTASchema);

export type CTA = z.infer<typeof CTASchema>;
export type CTAsResponse = z.infer<typeof CTAsResponseSchema>;
