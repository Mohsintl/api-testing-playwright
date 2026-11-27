import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Booking } from './schemas';

// Thin clients, one per API, like page objects for endpoints: tests say what they do
// ("create a booking") and the client knows the paths, headers and auth.

export const BOOKER_ADMIN = { username: 'admin', password: 'password123' };

export type BookerAuth = { token: string } | { basic: true } | null;

function authHeaders(auth: BookerAuth): Record<string, string> {
  if (!auth) return {};
  if ('token' in auth) return { Cookie: `token=${auth.token}` };
  const basic = Buffer.from(`${BOOKER_ADMIN.username}:${BOOKER_ADMIN.password}`).toString('base64');
  return { Authorization: `Basic ${basic}` };
}

export class BookerClient {
  constructor(private readonly request: APIRequestContext) {}

  ping(): Promise<APIResponse> {
    return this.request.get('/ping');
  }

  createToken(username: string, password: string): Promise<APIResponse> {
    return this.request.post('/auth', { data: { username, password } });
  }

  listBookings(filters: Record<string, string> = {}): Promise<APIResponse> {
    return this.request.get('/booking', { params: filters });
  }

  getBooking(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`);
  }

  createBooking(booking: unknown): Promise<APIResponse> {
    return this.request.post('/booking', { data: booking });
  }

  updateBooking(id: number, booking: Booking, auth: BookerAuth): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, { data: booking, headers: authHeaders(auth) });
  }

  patchBooking(id: number, changes: Partial<Booking>, auth: BookerAuth): Promise<APIResponse> {
    return this.request.patch(`/booking/${id}`, { data: changes, headers: authHeaders(auth) });
  }

  deleteBooking(id: number, auth: BookerAuth): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, { headers: authHeaders(auth) });
  }
}

export const DUMMY_USER = { username: 'emilys', password: 'emilyspass' };

export class DummyAuthClient {
  constructor(private readonly request: APIRequestContext) {}

  login(body: Record<string, unknown>): Promise<APIResponse> {
    return this.request.post('/auth/login', { data: body });
  }

  me(accessToken?: string): Promise<APIResponse> {
    return this.request.get('/auth/me', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
  }

  refresh(refreshToken: string): Promise<APIResponse> {
    return this.request.post('/auth/refresh', { data: { refreshToken, expiresInMins: 5 } });
  }
}
