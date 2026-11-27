import { test as base, expect } from '@playwright/test';
import { BOOKER_ADMIN, BookerClient, DummyAuthClient } from './clients';
import { aBooking } from './data';
import { createdBookingSchema, tokenSchema, type Booking } from './schemas';

type Fixtures = {
  booker: BookerClient;
  dummyAuth: DummyAuthClient;
  /** A fresh admin token for restful-booker. */
  token: string;
  /** A booking created for this test and deleted afterwards. */
  booking: { id: number; data: Booking };
};

export const test = base.extend<Fixtures>({
  booker: async ({ request }, use) => {
    await use(new BookerClient(request));
  },

  dummyAuth: async ({ request }, use) => {
    await use(new DummyAuthClient(request));
  },

  token: async ({ booker }, use) => {
    const res = await booker.createToken(BOOKER_ADMIN.username, BOOKER_ADMIN.password);
    expect(res.status()).toBe(200);
    await use(tokenSchema.parse(await res.json()).token);
  },

  booking: async ({ booker, token }, use) => {
    const data = aBooking();
    const res = await booker.createBooking(data);
    expect(res.status(), 'creating the test booking').toBe(200);
    const { bookingid } = createdBookingSchema.parse(await res.json());

    await use({ id: bookingid, data });

    // Clean up even when the test failed. A test that already deleted it gets 405 here.
    await booker.deleteBooking(bookingid, { token });
  },
});

export { expect };
