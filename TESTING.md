# Testing

This document describes how we test MapRoulette and how to choose the right kind of test for a given change. Our goal is to have a test suite that is easy to run, easy to maintain, and makes contributors feel confident that their changes haven't broken anything.

## Kinds of tests

We use two different kinds of tests, listed here in roughly the order you should reach for them.

### Unit tests

Unit tests (`src/**.test.ts`) cover pure functions, hooks, zod schemas, and most things in `src/api/` and `src/lib/`. They are the simplest kind of test: run a function with some arguments and check that it returns the correct result. They are fast, reliable, and should be the default choice when possible. If you can extract the logic you want to verify into a pure function and test it in isolation, do that.

### End-to-end tests

End-to-end tests (`e2e/*`) cover important user workflows by running the entire application (including a real backend and database). They interact with the UI the way a user does: by clicking links, typing in form fields, etc., and they examine the resulting webpage state (looking for expected strings or elements) to make sure the expected result has occurred. Since these tests exercise the whole application at once, they can detect bugs that other test methods will miss. But they are slow to run, hard to write, and more likely to break, so they should be used sparingly.

The purpose of end-to-end testing is to make sure that the pieces of the system work when put together. It should detect if e.g. the frontend is forgetting to send a required API parameter, or if navigation between different pages of the frontend is not working correctly. E2E tests should treat the backend as a black box, and should assume that it works correctly (it has its own test suite after all). Do not inspect the backend directly via the API or by querying the test database; only test what can be observed directly in the UI.

End to end tests should not use mocks. The point is to test the real system, not a facsimile of it. If you find yourself wanting to mock the API in an E2E test, that's a signal the test should be a unit test instead.

Tests must not depend on external services, like the openstreetmap.org API, Nominatim, or Overpass.

## How to run tests

`npm test` runs the unit tests. These are run by Vitest, and are fast and don't have any dependencies on external services.

`npm run test:e2e` runs the E2E suite in Playwright. The Playwright config starts the backend stack (PostGIS + the pinned `maproulette-backend` image) via `docker-compose.test.yaml` and the frontend dev server before the tests run, so it should work from a fresh clone with no further setup, apart from `npm install`. You will need either Docker or Podman installed to run them.
