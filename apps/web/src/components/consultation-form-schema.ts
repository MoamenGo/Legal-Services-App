import { zodResolver } from '@hookform/resolvers/zod';
import { leadInputSchema } from '@app/schemas';
import type { z } from 'zod';

/** The lead schema's user-entered fields; the API adds source, language and the captcha token. */
export const formSchema = leadInputSchema.pick({
  name: true,
  phone: true,
  email: true,
  caseType: true,
  message: true,
  preferredContact: true,
  privacyAccepted: true,
  marketingConsent: true,
});

export type FormInput = z.input<typeof formSchema>;
export type FormOutput = z.output<typeof formSchema>;

export const formResolver = zodResolver(formSchema);
