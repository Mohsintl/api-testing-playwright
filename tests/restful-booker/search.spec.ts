import { test, expect } from '../../src/fixtures';
import { aBooking, uniqueName } from '../../src/data';
import { bookingIdsSchema, createdBookingSchema } from '../../src/schemas';

test.describe('Booking search', () => {
  test('lists booking ids @smoke', async ({ booker }) => {
    const res = await booker.listBookings();
    expect(res.status()).toBe(200);
    expect(bookingIdsSchema.parse(await res.json()).length).toBeGreaterThan(0);
  });

  test('filters by first and last name', async ({ booker, booking }) => {
    const res = await booker.listBookings({ firstname: booking.data.firstname, lastname: booking.data.lastname });
    expect(res.status()).toBe(200);
    expect(bookingIdsSchema.parse(await res.json())).toEqual([{ bookingid: booking.id }]);
  });

  test('finds every booking with the same last name, and only those', async ({ booker, token }) => {
    const lastname = uniqueName('Family');
    const ids: number[] = [];
    for (const firstname of ['Ann', 'Ben', 'Cal']) {
      const res = await booker.createBooking(aBooking({ firstname, lastname }));
      expect(res.status(), `creating ${firstname} ${lastname}`).toBe(200);
      ids.push(createdBookingSchema.parse(await res.json()).bookingid);
    }
    try {
      const found = bookingIdsSchema.parse(await (await booker.listBookings({ lastname })).json());
      const byId = (a: number, b: number) => a - b;
      expect(found.map((b) => b.bookingid).sort(byId)).toEqual([...ids].sort(byId));

      const one = bookingIdsSchema.parse(await (await booker.listBookings({ firstname: 'Ben', lastname })).json());
      expect(one).toEqual([{ bookingid: ids[1] }]);
    } finally {
      for (const id of ids) await booker.deleteBooking(id, { token });
    }
  });

  test('a name nobody has booked under finds nothing', async ({ booker }) => {
    const res = await booker.listBookings({ lastname: uniqueName('Nobody') });
    expect(bookingIdsSchema.parse(await res.json())).toEqual([]);
  });
});
