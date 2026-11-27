import { test, expect } from '../../src/fixtures';
import { BOOKER_ADMIN } from '../../src/clients';
import { bookingSchema, tokenSchema } from '../../src/schemas';

test.describe('restful-booker auth', () => {
  test('admin credentials return a token @smoke', async ({ booker }) => {
    const res = await booker.createToken(BOOKER_ADMIN.username, BOOKER_ADMIN.password);
    expect(res.status()).toBe(200);
    expect(tokenSchema.parse(await res.json()).token).toMatch(/^[a-f0-9]+$/);
  });

  test('wrong credentials return no token', async ({ booker }) => {
    const res = await booker.createToken(BOOKER_ADMIN.username, 'wrong-password');
    expect(await res.json()).toEqual({ reason: 'Bad credentials' });
  });

  for (const [name, auth] of [
    ['no credentials', null],
    ['a made-up token', { token: 'not-a-real-token' }],
  ] as const) {
    test(`changing a booking with ${name} is forbidden`, async ({ booker, booking }) => {
      const changed = { ...booking.data, totalprice: 1 };
      expect((await booker.updateBooking(booking.id, changed, auth)).status()).toBe(403);
      expect((await booker.patchBooking(booking.id, { totalprice: 1 }, auth)).status()).toBe(403);
      expect((await booker.deleteBooking(booking.id, auth)).status()).toBe(403);

      // Nothing changed.
      const stored = bookingSchema.parse(await (await booker.getBooking(booking.id)).json());
      expect(stored).toEqual(booking.data);
    });
  }
});
