import { z } from 'zod';

// Contracts for the responses the tests read. A test parses every body it uses,
// so a renamed field, a wrong type or an extra wrapper fails with a clear message.

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected a YYYY-MM-DD date');

export const bookingSchema = z.strictObject({
  firstname: z.string(),
  lastname: z.string(),
  totalprice: z.number(),
  depositpaid: z.boolean(),
  bookingdates: z.strictObject({ checkin: isoDate, checkout: isoDate }),
  additionalneeds: z.string().optional(),
});
export type Booking = z.infer<typeof bookingSchema>;

export const createdBookingSchema = z.strictObject({
  bookingid: z.number().int().positive(),
  booking: bookingSchema,
});

export const bookingIdsSchema = z.array(z.strictObject({ bookingid: z.number().int().positive() }));

export const tokenSchema = z.strictObject({ token: z.string().min(1) });

export const dummyLoginSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  id: z.number().int(),
  username: z.string(),
  email: z.email(),
});

export const dummyUserSchema = z.object({
  id: z.number().int(),
  username: z.string(),
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
});

export const dummyErrorSchema = z.strictObject({ message: z.string().min(1) });
