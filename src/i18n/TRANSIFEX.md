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
3. Confirm the project config: `./.tx/config` points at the `maproulette / maproulette4` Transifex project. Change the slug if the project lives elsewhere.

## Day-to-day workflow

Every UI string uses `t('some.id', { placeholder }, 'fallback copy')` — see `IntlContext.tsx`.

### Add a string

1. Reference a new id in code: `t('profile.section.newThing', {}, 'Shiny new thing')`
2. Run `npm run i18n:extract -- --write` — this walks the repo, diffs used ids against `en-US.json`, and seeds missing ids with their default English from the third argument. Commit the updated `en-US.json`.
3. Push the new ids to Transifex: `npm run i18n:push`

### Pull translated locales

After translators have done their work:
```
npm run i18n:pull
```
This downloads every locale with at least 50% coverage and writes to `src/i18n/messages/<locale>.json`, then runs biome to normalize formatting.

### Check progress

`npm run i18n:status` — prints the per-locale translation percentages straight from Transifex.

## CI integration

The GitHub Actions workflow should run `npm run i18n:extract` in "check" mode (no `--write`) — it will exit non-zero if any new code uses a message id that isn't in the catalog, forcing PR authors to add the string before merging.

## Adding a new locale

1. Add its id to `src/i18n/locales.ts` → `localeOptions` (id plus the label shown in the language picker).
2. Enable it in Transifex (or add a lang_map entry if the Transifex tag differs from the IETF tag).
3. Next `npm run i18n:pull` will fetch it.

### Pluralization and other ICU syntax

`t()` renders every message through `intl-messageformat`, so full ICU MessageFormat syntax
(`plural`, `select`, number/date formatting) is supported, not just `{name}` interpolation.

For a string that varies with a count, write one id with a `plural` argument instead of
branching in code or defining separate `...Singular`/`...Plural` ids:

```ts
t('tasks.count', { count }, '{count, plural, one {# task} other {# tasks}}')
```

`#` inside a plural branch is replaced with the count, formatted for the active locale
(so `1234` renders as `1,234` in `en-US`). Only `one`/`other` are needed for English source
copy — translators can add `few`/`many`/`zero` branches for locales that need them (Russian,
Arabic, Polish, etc.); Transifex's KEYVALUEJSON editor detects the ICU syntax automatically and
gives translators the right categories for their locale.

Don't compute plural suffixes (`'s'`/`''`) or pick between two ids in JS — that bakes English
grammar into code and can't be corrected by a translator.

## Notes

- Placeholders use `{name}` syntax; IntlContext interpolates at render time via `intl-messageformat`.
- The `lang_map` entry in `.tx/config` maps Transifex's underscore locale tags (`pt_BR`) to our IETF dash tags (`pt-BR`).
