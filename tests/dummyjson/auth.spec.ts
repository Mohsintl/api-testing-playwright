import { test, expect } from '../../src/fixtures';
import { DUMMY_USER } from '../../src/clients';
import { dummyErrorSchema, dummyLoginSchema, dummyUserSchema } from '../../src/schemas';

// JWT login, a protected endpoint and token refresh on DummyJSON.

test.describe('DummyJSON auth', () => {
  test('login returns tokens that open the protected profile @smoke', async ({ dummyAuth }) => {
    const res = await dummyAuth.login({ ...DUMMY_USER, expiresInMins: 5 });
    expect(res.status()).toBe(200);
    const login = dummyLoginSchema.parse(await res.json());
    expect(login.username).toBe(DUMMY_USER.username);

    // The access token is a JWT, and its payload names the same user.
    const payload = JSON.parse(Buffer.from(login.accessToken.split('.')[1], 'base64url').toString());
    expect(payload).toMatchObject({ id: login.id, username: DUMMY_USER.username });

    const me = await dummyAuth.me(login.accessToken);
    expect(me.status()).toBe(200);
    expect(dummyUserSchema.parse(await me.json())).toMatchObject({ id: login.id, username: DUMMY_USER.username });
  });

  test('a refresh token gives a new access token that works', async ({ dummyAuth }) => {
    const login = dummyLoginSchema.parse(await (await dummyAuth.login({ ...DUMMY_USER, expiresInMins: 5 })).json());

    const res = await dummyAuth.refresh(login.refreshToken);
    expect(res.status()).toBe(200);
    const { accessToken } = await res.json();
    expect(typeof accessToken).toBe('string');
    expect((await dummyAuth.me(accessToken)).status()).toBe(200);
  });

  const badLogins: [string, Record<string, unknown>, string][] = [
    ['a wrong password', { username: DUMMY_USER.username, password: 'wrong' }, 'Invalid credentials'],
    ['an unknown user', { username: 'nobody-here', password: 'x' }, 'Invalid credentials'],
    ['no password', { username: DUMMY_USER.username }, 'Username and password required'],
    ['an empty body', {}, 'Username and password required'],
  ];
  for (const [name, body, message] of badLogins) {
    test(`login with ${name} is rejected with 400`, async ({ dummyAuth }) => {
      const res = await dummyAuth.login(body);
      expect(res.status()).toBe(400);
      expect(dummyErrorSchema.parse(await res.json()).message).toBe(message);
    });
  }

  test('the profile needs a token', async ({ dummyAuth }) => {
    const res = await dummyAuth.me();
    expect(res.status()).toBe(401);
    expect(dummyErrorSchema.parse(await res.json()).message).toBe('Access Token is required');
  });

  test('a made-up refresh token is rejected', async ({ dummyAuth }) => {
    const res = await dummyAuth.refresh('not-a-refresh-token');
    expect(res.status()).toBe(403);
    expect(dummyErrorSchema.parse(await res.json()).message).toBe('Invalid refresh token');
  });

  test(
    'a malformed access token should return 401',
    { annotation: { type: 'known defect', description: 'GET /auth/me with a malformed token returns 500' } },
    async ({ dummyAuth }) => {
      test.fail();
      expect((await dummyAuth.me('abc.def.ghi')).status()).toBe(401);
    },
  );
});
