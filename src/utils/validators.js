import { z } from 'zod';

/** Shared primitives so every form reports identical copy for the same rule. */
export const emailField = z
  .string()
  .min(1, 'Email address is required')
  .email('Enter a valid email address');

export const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const phoneField = z
  .string()
  .min(7, 'Enter a valid phone number')
  .regex(/^[+()\d\s-]+$/, 'Enter a valid phone number');

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional().default(false),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: emailField,
  phone: phoneField,
  password: passwordField,
  acceptedTerms: z.literal(true, {
    message: 'You must accept the Terms of Service to continue',
  }),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Party size is three separate counts because that is how the API models a
 * booking — and how it prices one. Infants are excluded from the property's
 * guest cap, so collapsing them into a single "guests" number would reject
 * stays the backend would happily accept.
 */
export const guestDetailsSchema = z
  .object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: emailField,
    phone: phoneField,
    checkIn: z.string().min(1, 'Select a check-in date'),
    checkOut: z.string().min(1, 'Select a check-out date'),
    adults: z.coerce.number().int().min(1, 'At least one adult').max(16, 'Maximum 16 adults'),
    children: z.coerce.number().int().min(0).max(16, 'Maximum 16 children'),
    infants: z.coerce.number().int().min(0).max(5, 'Maximum 5 infants'),
    specialRequests: z.string().max(500, 'Keep requests under 500 characters').optional(),
  })
  .refine((values) => new Date(values.checkOut) > new Date(values.checkIn), {
    message: 'Check-out must be after check-in',
    path: ['checkOut'],
  });

export const paymentSchema = z.object({
  method: z.string().min(1, 'Select a payment method'),
  expiresOn: z.string().min(1, 'Enter the expiry date'),
  bankName: z.string().min(2, 'Bank name is required'),
  accountName: z.string().min(2, 'Account name is required'),
  accountNumber: z.string().min(6, 'Enter a valid account number'),
  reference: z.string().min(3, 'Reference number is required'),
  amount: z.coerce.number().positive('Enter the amount you paid'),
  acceptedTerms: z.literal(true, { message: 'Accept the terms to continue' }),
});
