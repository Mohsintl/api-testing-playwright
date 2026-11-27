import { test, expect } from '@playwright/test';
import { bookingSchema, createdBookingSchema, dummyLoginSchema } from '../../src/schemas';

// A contract check is only worth having if it fails on a broken response.
// These tests seed the bugs an API could ship and prove each schema rejects them.
// They run without network, in a few milliseconds.

const good = {
  firstname: 'Ada',
  lastname: 'Lovelace',
  totalprice: 250,
  depositpaid: true,
  bookingdates: { checkin: '2027-01-01', checkout: '2027-01-05' },
  additionalneeds: 'Breakfast',
};

test('a correct booking passes the contract @smoke', () => {
  expect(bookingSchema.safeParse(good).success).toBe(true);
});

const brokenBookings: [string, unknown][] = [
  ['price sent as a string', { ...good, totalprice: '250' }],
  ['deposit sent as "true"', { ...good, depositpaid: 'true' }],
  ['a missing last name', (({ lastname, ...rest }) => rest)(good)],
  ['a renamed field', (({ firstname, ...rest }) => ({ ...rest, firstName: firstname }))(good)],
  ['an unexpected extra field', { ...good, internalNote: 'debug' }],
  ['a date in the wrong format', { ...good, bookingdates: { checkin: '01/01/2027', checkout: '2027-01-05' } }],
  ['dates flattened out of their object', (({ bookingdates, ...rest }) => ({ ...rest, ...bookingdates }))(good)],
  ['null instead of a booking', null],
];

for (const [bug, body] of brokenBookings) {
  test(`the booking contract rejects ${bug}`, () => {
    expect(bookingSchema.safeParse(body).success).toBe(false);
  });
}

test('the create response contract rejects a booking id of 0', () => {
  expect(createdBookingSchema.safeParse({ bookingid: 0, booking: good }).success).toBe(false);
});

test('the login contract rejects a response without a refresh token', () => {
  const login = { accessToken: 'a.b.c', id: 1, username: 'emilys', email: 'emily@example.com' };
  expect(dummyLoginSchema.safeParse(login).success).toBe(false);
  expect(dummyLoginSchema.safeParse({ ...login, refreshToken: 'r' }).success).toBe(true);
});
