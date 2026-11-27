import { test, expect } from '../../src/fixtures';
import { BOOKER_ADMIN } from '../../src/clients';
import { aBooking } from '../../src/data';
import { createdBookingSchema } from '../../src/schemas';

// Defects found while testing restful-booker, which is built with deliberate bugs.
// Each test asserts the CORRECT behaviour and is marked `test.fail()`: it passes while
// the bug is there, and turns red the day the API is fixed, so this list never goes stale.

const defect = (summary: string) => ({ annotation: { type: 'known defect', description: summary } });

test.describe('Known defects', () => {
  test('wrong credentials should return 401', defect('POST /auth with a wrong password returns 200'), async ({ booker }) => {
    test.fail();
    const res = await booker.createToken(BOOKER_ADMIN.username, 'wrong-password');
    expect(res.status()).toBe(401);
  });

  test('a booking missing required fields should return 400', defect('POST /booking without lastname, price or dates returns 500'), async ({ booker }) => {
    test.fail();
    const res = await booker.createBooking({ firstname: 'Ada' });
    expect(res.status()).toBe(400);
  });

  test('wrong field types should return 400', defect('POST /booking with a string price and a bad date returns 500'), async ({ booker }) => {
    test.fail();
    const res = await booker.createBooking({ ...aBooking(), totalprice: 'abc', bookingdates: { checkin: 'soon', checkout: '2027-01-05' } });
    expect(res.status()).toBe(400);
  });

  test('checkout before checkin should be rejected', defect('POST /booking accepts a checkout date before the checkin date'), async ({ booker, token }) => {
    test.fail();
    const res = await booker.createBooking(aBooking({ bookingdates: { checkin: '2027-03-10', checkout: '2027-03-01' } }));
    if (res.ok()) await booker.deleteBooking(createdBookingSchema.parse(await res.json()).bookingid, { token });
    expect(res.status()).toBe(400);
  });

  test('a negative total price should be rejected', defect('POST /booking accepts a negative totalprice'), async ({ booker, token }) => {
    test.fail();
    const res = await booker.createBooking(aBooking({ totalprice: -50 }));
    if (res.ok()) await booker.deleteBooking(createdBookingSchema.parse(await res.json()).bookingid, { token });
    expect(res.status()).toBe(400);
  });

  test('delete should return 200 or 204', defect('DELETE /booking/:id returns 201 Created'), async ({ booker, booking, token }) => {
    test.fail();
    const res = await booker.deleteBooking(booking.id, { token });
    expect([200, 204]).toContain(res.status());
  });

  test('deleting a booking twice should return 404', defect('A second DELETE of the same booking returns 405'), async ({ booker, booking, token }) => {
    test.fail();
    await booker.deleteBooking(booking.id, { token });
    expect((await booker.deleteBooking(booking.id, { token })).status()).toBe(404);
  });

  test('an XML response should say it is XML', defect('GET /booking/:id with Accept: application/xml sends XML labelled Content-Type: text/html'), async ({ booking, request }) => {
    test.fail();
    const res = await request.get(`/booking/${booking.id}`, { headers: { Accept: 'application/xml' } });
    expect(res.headers()['content-type']).toMatch(/xml/);
  });

  test('health check should return 200', defect('GET /ping returns 201 Created'), async ({ booker }) => {
    test.fail();
    expect((await booker.ping()).status()).toBe(200);
  });
});
