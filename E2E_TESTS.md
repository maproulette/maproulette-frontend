# Playwright E2E Tests

What `npm run test:e2e` covers, grouped by feature. **195 tests across 47 spec
files**, all of which run.

Specs live in [`e2e/`](e2e/); shared setup and API helpers are in
[`e2e/fixtures.ts`](e2e/fixtures.ts). Most fixtures build their data over HTTP;
`seedUser` is the exception and writes to the stack's database directly,
because the backend has no endpoint that creates users.

Every request runs as a seeded super user unless a test asks for someone else.
The backend no longer takes API keys, and a real login needs OpenStreetMap, so
the harness logs in by signing the backend's session cookie itself with the
test stack's `APPLICATION_SECRET` (`sessionCookie` in `e2e/fixtures.ts`). Any
seeded user can be acted as this way (`mapperRequest`, `reviewerPage`).
`e2e/global-setup.ts` seeds the super user and restarts the backend once so it
picks them up from `MR_SUPER_ACCOUNTS`, which it reads only at boot.

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

**Create form** — [`challenge-form-create.spec.ts`](e2e/challenge-form-create.spec.ts)
- Creating a challenge stores every field the form offers
- A changeset comment that already has the #maproulette hashtag is not given a second one
- A custom basemap stores its tile template
- A challenge with no team, basemap or keywords stores them as unset
- Submitting an incomplete form names every missing field and creates nothing
- Each task source asks for its own input
- A challenge can be created from a GeoJSON URL
- A challenge created from an uploaded GeoJSON file gets a task for its feature
- A second challenge with the same name is refused and the form stays open

**Task sources** — [`challenge-sources.spec.ts`](e2e/challenge-sources.spec.ts)
- An uploaded feature collection gets one task per feature with its properties and location
- A remote GeoJSON URL is downloaded by the backend and turned into tasks
- A line-by-line GeoJSON upload gets one task per line
- Features sharing a bundle id become one task holding all of them
- A file that is not valid GeoJSON is refused with its parse error and creates nothing
- An Overpass query is run by the backend and its results become tasks

**Rebuilding tasks** — [`challenge-rebuild.spec.ts`](e2e/challenge-rebuild.spec.ts)
- Rebuilding from a new upload updates matched tasks, adds new ones and keeps the rest
- Rebuilding with incomplete tasks removed first drops the ones missing from the new data
- Rebuilding a remote challenge downloads the URL again and applies what it now serves

**Edit form** — [`challenge-form-edit.spec.ts`](e2e/challenge-form-edit.spec.ts)
- Editing every field saves each one and the form reloads with them
- Renaming a challenge leaves its other settings alone, and keeps its keywords
- Choosing not to override the basemap clears the stored one
- Choosing No team hands a team-owned challenge back
- A challenge whose tasks are built shows its task source read-only and keeps it on save
- An edit with a required field emptied is not saved
- Cancelling an edit returns to the challenge without saving
- The update button stays disabled until something changes
- Renaming keeps the basemap; the form shows the stored difficulty, basemap,
  category and keywords

**Cloning** — [`challenge-clone.spec.ts`](e2e/challenge-clone.spec.ts)
- The clone form starts from the source challenge with a blank name and its query commented out
- A clone copies the source settings into a new challenge and leaves the source alone
- A clone keeps the source basemap
- A clone keeps the source keywords

**Lifecycle** — [`challenge-lifecycle.spec.ts`](e2e/challenge-lifecycle.spec.ts)
- The enabled, paused and featured switches save straight away and survive a reload
- Archiving and disabling from the project page are stored, and undone again
- Deleting from the project page asks first, and only removes the challenge once confirmed
- Moving a challenge to another project takes its tasks with it
- A disabled challenge is labelled as such on its manage page

**Prioritization** — [`challenge-prioritization.spec.ts`](e2e/challenge-prioritization.spec.ts)
- A property rule makes matching tasks high priority and the rest take the default
- A saved rule is shown again when the page is reopened
- Save is only offered once something changes, and discard puts the page back

**Finishing a challenge** — [`challenge-completion.spec.ts`](e2e/challenge-completion.spec.ts)
- Working through every task of a challenge records the results everywhere:
  each task's status, mapper and lock, the challenge's stats and completion,
  the mapper's metrics, the challenge page, the manage page's statistics and
  its task table
- A finished challenge has nothing left to map

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
  user, and can ask for it to be unlocked
- A lock that fails for any other reason offers no unlock request

**Completion statuses** — [`task-edit-status.spec.ts`](e2e/task-edit-status.spec.ts)
- Marking a task Fixed stores the status, the mapper and the time it was mapped
- Marking a task Already Fixed with a comment stores both
- Marking a task Not an Issue stores it and leaves the task read-only
- A task marked Can't Complete stays open and can then be fixed
- The status chosen in the confirmation dialog is the one saved
- Cancelling the confirmation dialog leaves the task untouched and still locked
- Status keys open the confirmation and Shift+Enter submits it

**Skipping, moving on and locks** — [`task-edit-workflow.spec.ts`](e2e/task-edit-workflow.spec.ts)
- Skipping only counts the skip: the status is kept and the task comes back
- Skipping a Can't Complete task keeps it Can't Complete and releases it
- Completing a task moves on to another task in the challenge, already locked
- Leaving a task and coming back keeps the lock, and Unlock releases it
- Starting a second task offers to release the first one
- Another mapper is told who holds the lock and can only preview the task
- The task panel shows the instructions, the feature properties and the activity

**Opening an editor** — [`editor-launch.spec.ts`](e2e/editor-launch.spec.ts)
- iD, Rapid and Level0 open on the task's element and location with the
  challenge's changeset comment, its `{{property}}` tags filled in, and its source
- Each JOSM option (load and zoom, new layer, just the features) sends the right
  remote-control commands, then the challenge's imagery; so does the R key
- A mapper is told when JOSM is not running
- The chosen default editor is saved and opened by the main editor button
- A task without an OSM element opens iD on its location and cannot load features in JOSM
- A disabled challenge leaves the short link out of the changeset comment
- A task opened in an editor is locked to the mapper and can then be marked fixed

**Instructions** — [`task-instructions.spec.ts`](e2e/task-instructions.spec.ts)
- Challenge instructions fill in the task properties, blank unknown ones and encode them in links
- A task's own instruction is shown instead of the challenge's
- Instructions stay filled in once the mapper starts working the task

**Tag fixes and cooperative tasks** — [`tag-fix-completion.spec.ts`](e2e/tag-fix-completion.spec.ts)
- A tag fix is shown against the element's current tags
- A tag fix whose element already carries the tags says there is nothing to change
- Working a tag-fix task opens the embedded iD on the element with the changeset
  comment, even when the mapper's default editor is JOSM
- A tag-fix task can be marked Fixed, Already Fixed, Not an Issue or Can't Complete
- A change-file cooperative challenge is labelled as cooperative, not as a tag fix
- *Expected to fail until fixed:* a change-file cooperative task has its change
  loaded into JOSM alongside the task area

**Bulk actions** — [`bulk-task-actions.spec.ts`](e2e/bulk-task-actions.spec.ts)
- Selected tasks can be given a new status, leaving the rest alone
- Selected tasks can be archived and unarchived
- Selected tasks can be deleted after confirming, and only those are removed
- Select all picks every visible task, and Clear drops the selection

**Task table** — [`bulk-task-filters.spec.ts`](e2e/bulk-task-filters.spec.ts)
- The status filter narrows the table and Clear brings every task back
- The task table sorts by id and status in either direction
- The property filter shows only tasks whose feature matches
- Exporting tasks downloads a CSV holding only the filtered tasks

## Projects

**Browsing** — [`project-browse.spec.ts`](e2e/project-browse.spec.ts)
- A user can search for a project and browse to its challenge list

**Managing** — [`project-management.spec.ts`](e2e/project-management.spec.ts)
- A user can create, edit and delete a project through the management UI

**Form** — [`project-form.spec.ts`](e2e/project-form.spec.ts)
- Creating a project with every field filled in stores each value
- The project form refuses to submit without a name or display name
- The project form refuses names longer than 255 characters
- The edit form loads the stored values and only allows saving once something changes
- Editing every field of a project is saved and shown again on reload
- Cancelling an edit leaves the project as it was

**Detail pages and list** — [`project-detail.spec.ts`](e2e/project-detail.spec.ts)
- The project sidebar counts challenges, discoverable challenges and tasks left
- The challenge filters on a project narrow the list and the Shown count
- Disabling and enabling a project from its page is stored on the project
- Archiving a project flags it as archived until it is unarchived
- The public project page totals completion across its challenges
- The public project page links to managing the project
- The manage projects list hides undiscoverable projects behind the Discoverable filter
- Making a project not discoverable from the projects list is stored on it
- Pinning a project from the projects list is remembered across reloads
- Deleting a project from its page schedules it for deletion

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

**Account** — [`settings-account.spec.ts`](e2e/settings-account.spec.ts)
- The save button stays disabled until something changes
- The default editor and basemap are saved and shown again after a reload
- Choosing a language saves it and switches the interface to it
- An invalid email is refused and a valid one is saved
- Ignoring mentions is saved and stops mention notifications arriving

**Profile page** — [`profile-stats.spec.ts`](e2e/profile-stats.spec.ts)
- A mapper earns points for the tasks they finish, and others can see their profile

## Localization

[`localization.spec.ts`](e2e/localization.spec.ts)
- Each language translates the interface, falls back to English where
  untranslated and survives a reload (de, es, fr, ja, pt-BR)
- Counted words take the plural form each language uses for one and for several
- Dates and decimal numbers follow the chosen language

## Notifications

[`notifications-page.spec.ts`](e2e/notifications-page.spec.ts)
- A mention arrives unread and can be marked read and unread again
- A deleted notification is gone for good
- Notifications group by task, and selecting them all marks every one read
- The category and task filters count and narrow the notifications
- A filtered view can be saved, re-applied after clearing, renamed and deleted

## Super admin

**Users** — [`super-admin.spec.ts`](e2e/super-admin.spec.ts)
- The users page lists the authenticated super user, and search filters it

**Challenge reports** — [`challenge-reports.spec.ts`](e2e/challenge-reports.spec.ts)
- Ordinary mappers file reports, and are held to one open report each
- Only a super admin sees reporters' contact details or can rule on a report

## Explore

**Location** — [`explore-location.spec.ts`](e2e/explore-location.spec.ts)
- Picking a location moves the map to it

---

## Not covered

- **Logging in.** The harness signs its own session cookies, so the OSM OAuth
  flow itself is never exercised.
- **Applying a tag fix inside iD.** The embedded iD loads from a CDN and fetches
  its presets and imagery from there, so it never starts on the test stack.
  What a tag-fix task proposes, the editor it opens and how it is completed are
  covered; editing inside iD is not.
- **Saving a changeset**, which needs the real OpenStreetMap API.
- **What the external editors do** with the URL or commands they are handed.
  Each editor's hand-off is checked exactly; the editors themselves are stubbed.
- **Task tags** — the task page has no way to edit them.

External services are stood in for locally: the specs route openstreetmap.org,
Rapid, Level0 and the CDN to stubs, record the JOSM remote control on
`127.0.0.1:8111`, and serve remote GeoJSON and Overpass responses from small
servers on the host, which the backend reaches as `host.docker.internal`
(`docker-compose.test.yaml` maps it, and points the backend's Overpass URL at
port `E2E_OVERPASS_STUB_PORT`, 18555 by default). On Linux those servers must
listen on every interface, so CI sets `E2E_STUB_LISTEN_HOST=0.0.0.0`.

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
