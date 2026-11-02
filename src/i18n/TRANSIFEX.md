# Transifex Integration

MR4's source of truth for UI copy is `src/i18n/messages/en-US.json`. Translated locales live next to it as `<locale>.json` and are lazy-loaded from `IntlContext`.

## One-time setup

1. **Install the Transifex CLI** (Go binary — see https://github.com/transifex/cli):
   ```
   curl -o- https://raw.githubusercontent.com/transifex/cli/master/install.sh | bash
   mv tx ~/.local/bin/   # or anywhere on PATH
   ```
2. **Set your API token** (from https://app.transifex.com/user/settings/api/):
   ```
   export TX_TOKEN=...   # or add to your shell rc
   ```
3. Confirm the project config: `./.tx/config` points at the `v4` resource of the `osmlab / maproulette3` Transifex project.

## Day-to-day workflow

Translation goes through [react-intl](https://formatjs.github.io/docs/react-intl). `useIntl()` from `@/i18n` returns `t`, which is react-intl's `formatMessage`:

```ts
t({ id: 'profile.section.newThing', defaultMessage: 'Shiny new thing' })
t({ id: 'tasks.count', defaultMessage: '{count, plural, one {# task} other {# tasks}}' }, { count })
```

Message ids and default messages must be string literals so they can be extracted. For a message chosen at runtime, declare the candidates with `defineMessages` and pass the chosen descriptor to `t`.

### Add a string

1. Reference a new id in code with its English default, as above.
2. Run `npm run i18n:extract` — this rewrites `en-US.json` from the messages in the source. Commit the updated `en-US.json`.
3. Once merged to `main`, the i18n Push workflow sends the new strings to Transifex (or run `npm run i18n:push` yourself).

### Pull translated locales

After translators have done their work:
```
npm run i18n:pull
```
This downloads every locale with at least 50% coverage and writes to `src/i18n/messages/<locale>.json`, then runs biome to normalize formatting.

### Check progress

`npm run i18n:status` — prints the per-locale translation percentages straight from Transifex.

## CI integration

`npm run check` includes `npm run i18n:check`, which regenerates `en-US.json` and fails if it differs from the committed file (missing, unused or changed strings) or if a message id isn't a string literal. Commit the regenerated file to fix it.

## Adding a new locale

1. Add its id to `src/i18n/locales.ts` → `localeOptions` (id plus the label shown in the language picker).
2. Enable it in Transifex (or add a lang_map entry if the Transifex tag differs from the IETF tag).
3. Next `npm run i18n:pull` will fetch it.

### Pluralization and other ICU syntax

Messages are ICU MessageFormat, so `plural`, `select` and number/date formatting are
supported, not just `{name}` interpolation.

For a string that varies with a count, write one id with a `plural` argument instead of
branching in code or defining separate `...Singular`/`...Plural` ids:

```ts
t({ id: 'tasks.count', defaultMessage: '{count, plural, one {# task} other {# tasks}}' }, { count })
```

`#` inside a plural branch is replaced with the count, formatted for the active locale
(so `1234` renders as `1,234` in `en-US`). Only `one`/`other` are needed for English source
copy — translators can add `few`/`many`/`zero` branches for locales that need them (Russian,
Arabic, Polish, etc.); Transifex's KEYVALUEJSON editor detects the ICU syntax automatically and
gives translators the right categories for their locale.

Don't compute plural suffixes (`'s'`/`''`) or pick between two ids in JS — that bakes English
grammar into code and can't be corrected by a translator.

## Notes

- Placeholders use `{name}` syntax and are filled in by react-intl at render time.
- The `lang_map` entry in `.tx/config` maps Transifex's underscore locale tags (`pt_BR`) to our IETF dash tags (`pt-BR`).
