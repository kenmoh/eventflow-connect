import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().email('Enter a valid email').max(255),
  phone: z.string().trim().min(7, 'Phone is required').max(30),
});

export const reservationSchema = customerSchema.extend({
  date: z.string().min(1, 'Choose a date'),
  people: z.number().int().min(1).max(10000).optional(),
});

export const checkoutSchema = customerSchema.extend({
  date: z.string().min(1, 'Event date required'),
  address: z.string().trim().min(3, 'Delivery address required').max(300),
  method: z.enum(['paystack-card', 'paystack-transfer', 'paystack-ussd']),
});

export const employeeSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(6, 'At least 6 characters').max(120),
  roleId: z.string().min(1, 'Pick a role'),
});

export const trackSchema = z.object({
  query: z.string().trim().min(3, 'Enter email or reference').max(255),
});
