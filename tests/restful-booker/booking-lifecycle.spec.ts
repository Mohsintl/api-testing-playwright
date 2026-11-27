import { test, expect } from '../../src/fixtures';
import { aBooking } from '../../src/data';
import { bookingSchema, createdBookingSchema } from '../../src/schemas';

test.describe('Booking lifecycle', () => {
  test('create, read, update, patch and delete a booking @smoke', async ({ booker, token }) => {
    const booking = aBooking();

    // Create: the response echoes the booking back with its new id.
    const created = await booker.createBooking(booking);
    expect(created.status()).toBe(200);
    const { bookingid, booking: echoed } = createdBookingSchema.parse(await created.json());
    expect(echoed).toEqual(booking);

    // Read: the stored booking matches what was sent.
    const read = await booker.getBooking(bookingid);
    expect(read.status()).toBe(200);
    expect(bookingSchema.parse(await read.json())).toEqual(booking);

    // Update (PUT) replaces the whole booking.
    const updated = { ...booking, totalprice: 410, depositpaid: false, additionalneeds: 'Late checkout' };
    const put = await booker.updateBooking(bookingid, updated, { token });
    expect(put.status()).toBe(200);
    expect(bookingSchema.parse(await put.json())).toEqual(updated);

    // Patch changes only the fields sent.
    const patch = await booker.patchBooking(bookingid, { firstname: 'Grace' }, { token });
    expect(patch.status()).toBe(200);
    expect(bookingSchema.parse(await patch.json())).toEqual({ ...updated, firstname: 'Grace' });

    // Delete, then the booking is gone.
    const deleted = await booker.deleteBooking(bookingid, { token });
    expect(deleted.ok()).toBeTruthy();
    expect((await booker.getBooking(bookingid)).status()).toBe(404);
  });

  test('a booking without additional needs is stored without the field', async ({ booker, token }) => {
    const { additionalneeds, ...booking } = aBooking();
    const res = await booker.createBooking(booking);
    expect(res.status()).toBe(200);
    const { bookingid, booking: stored } = createdBookingSchema.parse(await res.json());
    expect(stored).not.toHaveProperty('additionalneeds');
    await booker.deleteBooking(bookingid, { token });
  });

  test('basic auth works as well as a token', async ({ booker, booking }) => {
    const res = await booker.patchBooking(booking.id, { totalprice: 99 }, { basic: true });
    expect(res.status()).toBe(200);
    expect(bookingSchema.parse(await res.json()).totalprice).toBe(99);
  });

  test('a booking that does not exist returns 404', async ({ booker }) => {
    expect((await booker.getBooking(999_999_999)).status()).toBe(404);
  });

  test('responses come back as XML when asked for XML', async ({ booking, request }) => {
    const res = await request.get(`/booking/${booking.id}`, { headers: { Accept: 'application/xml' } });
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain(`<lastname>${booking.data.lastname}</lastname>`);
  });
});
