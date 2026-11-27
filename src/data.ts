import { randomUUID } from 'node:crypto';
import type { Booking } from './schemas';

// restful-booker is shared by everyone who practises on it, so every booking a test
// makes carries a unique last name. Searches then match only this run's data.
export function uniqueName(prefix = 'Test'): string {
  return `${prefix}${randomUUID().slice(0, 8)}`;
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function aBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: 'Ada',
    lastname: uniqueName(),
    totalprice: 250,
    depositpaid: true,
    bookingdates: { checkin: isoDaysFromNow(30), checkout: isoDaysFromNow(33) },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
