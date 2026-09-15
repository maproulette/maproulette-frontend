# Playwright E2E Tests

What `npm run test:e2e` covers, grouped by feature. **43 tests across 21 spec
files**: 41 run, and 2 are skipped because they need a second *authenticated*
identity the harness cannot provision on its own (see
[Not covered](#not-covered)).

Specs live in [`e2e/`](e2e/); shared setup and API helpers are in
[`e2e/fixtures.ts`](e2e/fixtures.ts). Most fixtures build their data over HTTP;
`seedUser` is the exception and writes to the stack's database directly,
because the backend has no endpoint that creates users.

---

## Challenges

**Browsing** — [`challenge-browse.spec.ts`](e2e/challenge-browse.spec.ts)
- A user can start mapping a challenge from its challenge page
- A user can comment on a challenge and see it in the comments modal

**Creating** — [`create-challenge.spec.ts`](e2e/create-challenge.spec.ts)
- A user can submit the create-challenge form with a local GeoJSON file

**Managing** — [`challenge-management.spec.ts`](e2e/challenge-management.spec.ts)
- A user can edit an existing challenge and see the changes persisted
- A user can archive an existing challenge and see it flagged as archived

**Finding** — [`challenge-search.spec.ts`](e2e/challenge-search.spec.ts)
- A user can find a challenge by name using the header search bar

## Tasks

**Working a task** — [`task-workflow.spec.ts`](e2e/task-workflow.spec.ts)
- A user can open a task, view its details, and mark it as fixed

**Status** — [`task-status.spec.ts`](e2e/task-status.spec.ts)
- A user can mark a task as Not an Issue with a comment, and it sticks

**Comments** — [`task-comments.spec.ts`](e2e/task-comments.spec.ts)
- A user can comment on a task and see it in the task activity feed

**Bundling** — [`task-bundling.spec.ts`](e2e/task-bundling.spec.ts)
- A user can lasso-bundle a second task and clear the bundle

**Locking** — [`task-locking.spec.ts`](e2e/task-locking.spec.ts)
- A second user is told a task is locked when they open it after the first
  user *(needs `E2E_REVIEWER_API_KEY`)*

## Projects

**Browsing** — [`project-browse.spec.ts`](e2e/project-browse.spec.ts)
- A user can search for a project and browse to its challenge list

**Managing** — [`project-management.spec.ts`](e2e/project-management.spec.ts)
- A user can create, edit and delete a project through the management UI

## Teams

**Lifecycle** — [`teams.spec.ts`](e2e/teams.spec.ts)
- A user can create a team, see it on the dashboard, and delete it

**Editing** — [`team-editing.spec.ts`](e2e/team-editing.spec.ts)
- A user can rename a team from its edit page

**Membership** — [`team-membership.spec.ts`](e2e/team-membership.spec.ts)
- The invite dialog offers the roles a team can hand out
- A team cannot be left without an owner

**Detail page** — [`team-detail.spec.ts`](e2e/team-detail.spec.ts)
- A team page shows the team on the left and its sections on the right
- The members table lists the creator with their role
- The chosen section is kept in the url so it survives a reload
- A challenge given to a team shows up in its Challenges section
- A team with no challenges says so rather than showing an empty grid
- A project the team manages shows up in its Projects section
- A team that manages no project says so

## Giving a challenge away

**To a team** — [`challenge-teams.spec.ts`](e2e/challenge-teams.spec.ts)
- A challenge is credited to the team that owns it, not its creator
- A challenge with no owning team is credited to a person
- The challenge form offers the teams the user runs, and No team
- Choosing a team on the form gives the challenge to that team
- A team-owned challenge appears on that team page and can be handed back

**To a user** — [`challenge-managers.spec.ts`](e2e/challenge-managers.spec.ts)
- The managers panel opens and reports that nobody has been granted a role
- The panel explains that project and team managers are not listed
- Searching for someone who does not exist says so
- A role can be chosen before anyone is added
- A user can be added as a manager and shows up with their role
- A manager's role can be changed, and they keep just the one
- A manager can be removed again

**Tag fix (cooperative)** — [`challenge-tag-fix.spec.ts`](e2e/challenge-tag-fix.spec.ts)
- A tag-fix challenge is labelled as one on its challenge page
- An ordinary challenge is not labelled as a tag fix
- A tag-fix task shows the tag changes the challenge proposes
- An ordinary task shows no suggested changes

## Settings

**Profile** — [`profile-settings.spec.ts`](e2e/profile-settings.spec.ts)
- A user can update their custom basemap URL setting

## Explore

**Location** — [`explore-location.spec.ts`](e2e/explore-location.spec.ts)
- Picking a location moves the map to it

---

## Not covered

Every request the harness makes carries `MR_SUPER_KEY`, which the backend maps
to a single synthetic super user rather than to any row in the users table. No
endpoint creates users — real ones only arrive through OSM OAuth — so anything
needing a second person, or needing permissions to actually bite, is out of
reach.

- **Acting *as* a granted user.** A user can be seeded into the database to be
  granted a role (`seedUser` in `e2e/fixtures.ts`), so granting, re-roling and
  revoking are all covered. What that grant actually lets them *do* is not:
  authenticating as them needs an API key. That is covered in the backend's
  `ChallengeServiceSpec`.
- **Applying a tag fix.** The apply step runs inside an embedded iD editor
  against real OpenStreetMap data the test stack cannot reach. What a tag-fix
  challenge and its tasks propose is covered; carrying it out is not.
- **Super admin** — [`super-admin.spec.ts`](e2e/super-admin.spec.ts) is
  `test.skip`: the users page needs a real super-admin-granted identity.
  `src/lib/SuperAdminGuard.test.ts` unit-tests the guard predicate instead.
- **Two-user task locking** — runs only when `E2E_REVIEWER_API_KEY` is set to a
  real user's `"<userId>|<rawKey>"` key. Provisioning one is a manual,
  out-of-band step documented in `e2e/fixtures.ts`.
- **Review workflow** — no specs at all; there is no reviewer UI yet.

## Running them

```sh
npm run test:e2e          # full suite
npm run test:e2e:ui       # Playwright UI mode
npm run test:e2e:report   # last HTML report
```

The stack (Postgres + backend) comes up via `docker-compose.test.yaml` and
binds port **9000**, so stop any local backend on that port first.

**Backend work on an unmerged branch needs a locally built image.** The compose
file defaults to the published `main` image, which does not contain it — the
team and challenge-ownership specs 404 against it:

```sh
(cd ../maproulette-backend && docker build --platform linux/amd64 \
   -t maproulette-backend:local .)
MR_TEST_BACKEND_IMAGE=maproulette-backend:local npm run test:e2e
```

### Known flakiness

`task-bundling`, `task-status` and `task-workflow` intermittently fail in
full-suite runs and pass in isolation. Reproduced on both the published image
and a local build, so it predates the team work — these are the three
map-driven specs.
