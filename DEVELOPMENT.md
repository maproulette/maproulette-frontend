# MapRoulette Development

This is the repository that holds the frontend code. The backend and API
are developed in parallel in a separate repo: [maproulette-backend](https://github.com/maproulette/maproulette-backend).

The frontend needs a backend server to talk to. By default it uses the
production server at maproulette.org, so you can work on the frontend without
setting up a backend of your own.

### Basic Dependencies

* [Node 24](https://nodejs.org/) (see `.nvmrc`)

### Initial Setup

1. `npm install` to fetch and install NPM modules. This also creates a `.env`
   file from `.env.example` if you don't have one yet.

2. `npm run start` to fire up the frontend development server at
   http://127.0.0.1:3001

Configuration lives in `.env`, which is gitignored. This file gets transformed
into `env.json` at build time, and sent to the browser so it can be read at
runtime from `window.env`. This means everything in the file is public, so don't
put secrets in there.

#### Developing against the production backend

In the default setup, the local frontend dev server talks to the production
backend (`VITE_API_BASE_URL` is set to `https://maproulette.org` in `.env.example`).

In dev mode, the dev server proxies the backend (this is needed because the
backend's session cookies are restricted to its own Origin). This means clicking
"Sign in" will just work and you'll see a normal OSM OAuth flow, then be sent
back to your local dev server once you click "Authorize".

Keep in mind that you're working with real data and your real OSM account.
Anything you create, edit or complete is done for real on maproulette.org,
and edits through the built-in editor will be saved to OpenStreetMap.

#### Developing with a local backend server

Alternatively, you can run a local copy of the backend server.

1. Set up and run the backend. There are two ways to do this:

   * **From source:** clone [maproulette-backend](https://github.com/maproulette/maproulette-backend)
     and follow its README to set up a PostGIS database and `conf/dev.conf`,
     then start it with `sbt run`.
   * **From a Docker image:** pull the published image (or build your own from
     a backend checkout with `docker build -t maproulette-backend:local .`)
     and run it against a PostGIS database. The backend is configured with
     `MR_*` environment variables; see `docker-compose.test.yaml` in this repo
     for a working example. For instance, with PostGIS running on the host:

     ```sh
     docker run --rm -p 9000:80 \
       -e MR_DATABASE_URL=jdbc:postgresql://host.docker.internal:5432/maproulette-db \
       -e MR_DATABASE_USERNAME=maproulette-db-user \
       -e MR_DATABASE_PASSWORD=maproulette-db-pass \
       -e APPLICATION_SECRET=some-secret-at-least-32-characters-long \
       -e MAPROULETTE_SECRET_KEY=another-secret-at-least-32-characters \
       -e MR_OSM_SERVER=https://master.apis.dev.openstreetmap.org \
       -e MR_OAUTH_CONSUMER_KEY=your-client-id \
       -e MR_OAUTH_CONSUMER_SECRET=your-client-secret \
       ghcr.io/maproulette/maproulette-backend:main
     ```

     On Linux, add `--add-host=host.docker.internal:host-gateway` so the
     container can reach the database on the host.

   With either method, the backend listens on port 9000.

2. To be able to log in, the backend needs to be registered as an OpenStreetMap OAuth
   application. Create an account on [master.apis.dev.openstreetmap.org](https://master.apis.dev.openstreetmap.org),
   or sign in if you already have one. This server runs a full copy of the OpenStreetMap
   website stack and is intended for development purposes. It has its own database, so
   your regular openstreetmap.org credentials won't work here.

3. Open your account settings (click profile name in upper right then "My Settings").
   Then go to the "OAuth 2 applications" tab and choose "Register new application" to
   create a new application for development. Choose a name for the application that will
   help you remember what it's for, e.g. "My MapRoulette local dev environment". Set the
   `Redirect URL` to `http://127.0.0.1:3001` (the frontend dev server). The backend
   sends OSM back to whichever frontend origin the login started from, so if you also
   open the dev server as `http://localhost:3001`, register that too.

   The required app permissions are:
   - "Read user preferences" (`read_prefs`)
   - "Modify the map" (`write_api`)

   Copy your new app's Client ID and Client Secret. They will only be shown once!

4. Give the Client ID and Client Secret to the backend: set `osm.consumerKey`
   and `osm.consumerSecret` in `conf/dev.conf` if you're running from source, or
   `MR_OAUTH_CONSUMER_KEY` and `MR_OAUTH_CONSUMER_SECRET` if you're running the
   Docker image. Restart the backend.

5. Edit your `.env` file in your frontend project and set:
   ```
   VITE_API_BASE_URL="http://127.0.0.1:9000"
   ```
   Restart your frontend dev server (the proxy target is read at startup), and
   then navigate to the frontend at http://127.0.0.1:3001

## Building for production

To create a production bundle, you can run these commands:

1. `npm install` to install and update NPM packages.

2. `npm run build` to create a minified frontend build in the `dist/`
   directory.

The build includes an `env.json` holding the defaults from `.env.example`.
Settings are read from it at runtime, so the artifact can be reconfigured
at deployment time without rebuilding.

## Using the production container image

We also publish a Docker image to `ghcr.io/maproulette/maproulette-frontend`
for every commit to `main` and every release tag. It serves the build with
nginx, and any `VITE_*` environment variables set on the container override
the defaults in `env.json` when it starts (see `docker/90-write-env-to-json.sh`).
For example:

```sh
docker run -p 8080:80 \
  -e VITE_API_BASE_URL=https://maproulette.example.com \
  ghcr.io/maproulette/maproulette-frontend:main
```

To build the image yourself, run `docker build -t maproulette-frontend .`

# Development Notes

The project is built with [Vite](https://vite.dev/), React and TypeScript.

## Tests

Unit tests are built with [Vitest](https://vitest.dev/), and end-to-end tests
with [Playwright](https://playwright.dev/). See [TESTING.md](TESTING.md) for
how to run them and advice about how to add new tests.

## Linting and formatting

We use [Biome](https://biomejs.dev/) for both linting and formatting. Run
`npm run format` to format your code, and `npm run lint` to check for lint
errors (`npm run lint:fix` will fix any lint errors that can be corrected
automatically).

Pull requests are run through a CI (Continuous Integration) process that checks
formatting, linting, types, dead code and the translation catalog. You can run
`npm run check` to apply these same checks locally. This will report any
problems but won't make any changes (`npm run check:fix` fixes what it can).

If you want, you can enable a pre-commit hook to run these checks automatically
when you run `git commit`. To enable the check, run this command in the root of
the repository:

```
git config core.hooksPath hooks
```

This configures Git to use the hook scripts in the `hooks/` directory. The
`pre-commit` script there is run when Git prepares a commit. That script runs
`npm run check`.

If you want to skip the check for a particular commit (for work-in-progress commits
for example), run `git commit --no-verify`.

## CSS Styling and Naming

We are using [Tailwind CSS](https://tailwindcss.com) v4, configured in CSS
(see `src/main.css`). UI primitives such as buttons, dialogs and menus live in
`src/components/ui/`; use those rather than styling raw elements. Colors come
from the palette in `src/styles/palette.css` and the semantic tokens in
`src/main.css`, which handle dark mode themselves; the Introduction page in
Storybook describes them.

## Internationalization, Localization, and Translation

Internationalization and localization is performed via
[react-intl](https://formatjs.github.io/docs/react-intl). Every user-visible
string is given an id and a default (U.S. English) message where it's used.

`npm run i18n:extract` rebuilds `src/i18n/messages/en-US.json` from the
messages in the source. Run it after adding or removing strings; `npm run
check` fails if the committed file is out of date.

Translations for other locales are managed through
[Transifex](https://app.transifex.com/osmlab/maproulette3/), who kindly provides
us with free service through their Open Source program. Translation files are
pulled into the code repository automatically and stored in the
`src/i18n/messages/` directory.

See [src/i18n/TRANSIFEX.md](src/i18n/TRANSIFEX.md) for details, including how
to add support for a new locale.
