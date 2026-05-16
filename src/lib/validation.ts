import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().email('Enter a valid email').max(255),
  phone: z.string().trim().min(7, 'Phone is required').max(30),
});

export const reservationSchema = customerSchema.extend({
  date: z.string().min(1, 'Choose a date').refine(d => !d || new Date(d) >= new Date(new Date().toDateString()), { message: 'Date must be today or later' }),
  people: z.number().int().min(1).max(10000).optional(),
});

export const checkoutSchema = customerSchema.extend({
  date: z.string().min(1, 'Event date required').refine(d => !d || new Date(d) >= new Date(new Date().toDateString()), { message: 'Date must be today or later' }),
  address: z.string().trim().min(3, 'Delivery address required').max(300),
  method: z.enum(['paystack', 'paystack-card', 'paystack-transfer']),
});

export const employeeSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8, 'At least 8 characters').max(120),
  roleId: z.string().min(1, 'Pick a role'),
});

export const trackSchema = z.object({
  query: z.string().trim().min(3, 'Enter email or reference').max(255),
});

export const emailApiSchema = z.object({
  to: z.string().trim().email('Invalid recipient email'),
  subject: z.string().trim().min(1).max(200),
  html: z.string().trim().min(1).max(50000),
  attachments: z.array(z.object({
    filename: z.string().max(100),
    content: z.string().max(5000000),
  })).max(5).optional(),
});
