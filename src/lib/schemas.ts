import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, 'auth.invalidEmail')
  .email('auth.invalidEmail');

export const passwordSchema = z
  .string()
  .min(6, 'auth.passwordTooShort');

export const displayNameSchema = z
  .string()
  .min(1, 'auth.nameRequired')
  .max(60, 'auth.nameRequired');

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z.object({
  display_name: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.passwordsDontMatch',
    path: ['confirmPassword'],
  });

export const dailyTaskSchema = z.object({
  title: z.string().min(1, 'common.required').max(200),
  task_date: z.string().min(1, 'common.required'),
});

export const profileSchema = z.object({
  display_name: displayNameSchema.optional().or(z.literal('')),
  bio: z.string().max(280).optional().or(z.literal('')),
  avatar_url: z.string().nullable().optional(),
});

export const invitationCodeSchema = z
  .string()
  .min(4, 'partner.join.invalid')
  .max(12, 'partner.join.invalid')
  .regex(/^[A-Za-z0-9]+$/, 'partner.join.invalid');

export const timelineEventSchema = z.object({
  title: z.string().min(1, 'common.required').max(120),
  description: z.string().max(2000).optional().or(z.literal('')),
  event_date: z.string().min(1, 'common.required'),
  category: z.enum(['milestone', 'trip', 'date', 'photo', 'note', 'other']),
  cover_url: z.string().url().nullable().optional(),
});

export const memorySchema = z.object({
  title: z.string().min(1, 'common.required').max(120),
  caption: z.string().max(500).optional().or(z.literal('')),
  media_url: z.string().min(1, 'common.required'),
  media_type: z.enum(['image', 'video']),
  location: z.string().max(200).optional().or(z.literal('')),
  taken_at: z.string().optional().nullable(),
});

export const loveMapLocationSchema = z.object({
  name: z.string().min(1, 'common.required').max(120),
  description: z.string().max(1000).optional().or(z.literal('')),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().max(300).optional().or(z.literal('')),
  category: z.enum([
    'special',
    'first_date',
    'trip',
    'restaurant',
    'home',
    'other',
  ]),
});

export const datePlanSchema = z.object({
  title: z.string().min(1, 'common.required').max(120),
  description: z.string().max(2000).optional().or(z.literal('')),
  scheduled_at: z.string().optional().nullable(),
  status: z.enum(['idea', 'planned', 'completed', 'cancelled']),
  location: z.string().max(200).optional().or(z.literal('')),
  budget_estimate: z.number().min(0).max(1_000_000).optional().nullable(),
});

export const giftSchema = z.object({
  recipient: z.enum(['partner', 'me']),
  name: z.string().min(1, 'common.required').max(120),
  description: z.string().max(1000).optional().or(z.literal('')),
  occasion: z.string().max(120).optional().or(z.literal('')),
  budget_estimate: z.number().min(0).max(1_000_000).optional().nullable(),
  link_url: z.string().url().nullable().optional().or(z.literal('')),
  status: z.enum(['idea', 'purchased', 'given', 'archived']),
});

export const anniversarySchema = z.object({
  title: z.string().min(1, 'common.required').max(120),
  description: z.string().max(1000).optional().or(z.literal('')),
  anniversary_date: z.string().min(1, 'common.required'),
  recurrence: z.enum(['once', 'yearly', 'monthly']),
});

export const chatMessageSchema = z.object({
  content: z.string().min(1, 'common.required').max(4000),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type DailyTaskValues = z.infer<typeof dailyTaskSchema>;
