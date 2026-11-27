# API testing with Playwright

[![API tests](https://github.com/Mohsintl/api-testing-playwright/actions/workflows/api-tests.yml/badge.svg)](https://github.com/Mohsintl/api-testing-playwright/actions/workflows/api-tests.yml)

An API test suite in [Playwright](https://playwright.dev/) and TypeScript for two public practice APIs: [restful-booker](https://restful-booker.herokuapp.com/apidoc/index.html), a hotel booking API, and [DummyJSON](https://dummyjson.com/docs/auth)'s JWT auth. 42 tests: full CRUD lifecycles, auth and permissions, search, response contracts checked with [zod](https://zod.dev/), and 10 defects found along the way.

## What it covers

| Spec | Tests | Covers |
| :--- | ---: | :--- |
| `restful-booker/booking-lifecycle.spec.ts` | 5 | Create, read, update (PUT), patch and delete one booking end to end; optional fields; basic auth; 404; XML responses |
| `restful-booker/auth.spec.ts` | 4 | Token creation, wrong credentials, and that PUT, PATCH and DELETE are refused without valid auth and change nothing |
| `restful-booker/search.spec.ts` | 4 | Filtering by first and last name, several bookings under one name, no matches |
| `restful-booker/known-defects.spec.ts` | 9 | Defects in restful-booker (below) |
| `dummyjson/auth.spec.ts` | 9 | JWT login and its payload, the protected profile, token refresh, four kinds of bad login, missing and made-up tokens, one defect |
| `contracts/schemas-catch-bugs.spec.ts` | 11 | Proves each contract schema rejects a broken response, with no network |

Smoke tests (`@smoke`) cover one happy path per area.

## How it is built

- **Clients, like page objects for endpoints.** `src/clients.ts` holds a client per API. Tests say what they do (`booker.createBooking(...)`) and the client knows paths, headers and the two auth styles (token cookie and basic auth).
- **Fixtures that clean up after themselves.** `src/fixtures.ts` gives a test a fresh token, or a booking that is created before the test and deleted after it, even when the test fails.
- **Unique test data.** restful-booker is shared by everyone who practises on it, so every booking gets a unique last name (`src/data.ts`) and searches only ever match this run's data.
- **Contract checks on every body.** Each response a test reads goes through a strict zod schema (`src/schemas.ts`): a wrong type, a renamed or extra field, or a bad date format fails with a clear message.
- **Tests for the tests.** A contract check is only useful if it fails on a broken response, so `contracts/` seeds eight kinds of broken booking and checks the schema rejects every one.

## Defects found

Each one is a test that asserts the **correct** behaviour and is marked `test.fail()`. It passes while the bug is there and turns red the day the API is fixed, so the list can't go stale. Each also carries a `known defect` annotation that shows in the HTML report.

| API | Request | Expected | Actual |
| :--- | :--- | :--- | :--- |
| restful-booker | `POST /auth` with a wrong password | 401 | 200 `{"reason":"Bad credentials"}` |
| restful-booker | `POST /booking` missing required fields | 400 | 500 |
| restful-booker | `POST /booking` with a string price and an invalid date | 400 | 500 |
| restful-booker | `POST /booking` with checkout before checkin | 400 | 200, booking stored |
| restful-booker | `POST /booking` with a negative price | 400 | 200, booking stored |
| restful-booker | `DELETE /booking/:id` | 200 or 204 | 201 Created |
| restful-booker | `DELETE` of an already deleted booking | 404 | 405 |
| restful-booker | `GET /booking/:id` with `Accept: application/xml` | XML content type | XML body labelled `text/html` |
| restful-booker | `GET /ping` | 200 | 201 Created |
| DummyJSON | `GET /auth/me` with a malformed token | 401 | 500 |

restful-booker is built with deliberate bugs for practice, so these are expected; the point is finding and pinning them.

## Run it

```bash
npm ci
npx playwright test             # everything
npm run test:smoke              # @smoke only
npm run test:contracts          # schema self-checks, no network
npx playwright show-report      # HTML report with the defect annotations
```

No browser is needed: the tests use Playwright's `request` fixture.

## CI

`.github/workflows/api-tests.yml` runs on every pull request, on `master` and nightly, since the APIs can change without a commit here. It type checks, runs the contract self-checks, checks both APIs are up (so an outage is not mistaken for a failing test), runs the suite, publishes the results as a check with [dorny/test-reporter](https://github.com/dorny/test-reporter) and keeps the HTML report as an artifact. Both APIs are shared public services, so CI retries a failed test once and runs two workers to keep the load low.
