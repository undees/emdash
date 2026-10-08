# Em Dash

Errands & munchies, in a dash. A shopping list app for sending someone to the store.

## What it does

- Start a new grocery list (forgetting the old one)
- Add and remove items
- Share the list via your phone's native share sheet (iMessage, text, etc.)

That's it. No accounts, no subscriptions, no "premium tier" for the privilege of buying milk.

## Tech

- [Lit](https://lit.dev/) web components (~35KB bundled)
- [Bun](https://bun.sh/) for package management and bundling
- `localStorage` for persistence
- Web Share API for sending the list
- Deployed as a static site on [Render](https://render.com/)

## Development

```bash
bun install
bun run build
bun run serve
```

Then open http://localhost:3000.

For watch mode during development:

```bash
bun run dev
```

### Architecture

Em Dash is a single-page app with no framework router, no server, and no build-time templating. Everything is plain ES modules bundled by Bun into one `public/app.js` file.

**Runtime stack**

| Layer | Tool |
|---|---|
| UI components | Lit 3.3 web components |
| Bundler | Bun (`bun build`) |
| Persistence | `localStorage` (no backend) |
| Sharing | Web Share API |
| E2E tests | Playwright (Python, WebKit) |
| Unit tests | Bun's built-in test runner |

**Directory layout**

```
src/
  app.js                   # Entry point — imports and registers the root component
  aisle-defaults.js        # [key, aisleLabel] pairs for auto-assignment
  familect.js              # Household shorthand terms → canonical product names
  utils.js                 # Pure utility functions (data creation, migration, etc.)

  components/
    em-dash.js             # Root shell: owns all state, handles all events
    grocery-list.js        # Renders items + aisles; inline editing; move picker
    add-item.js            # Text input + "Add" / "+ Aisle" buttons
    the-nines.js           # Quick-add 3×3 grid from add history
    share-button.js        # Web Share API trigger; plain-text list formatter

public/
  index.html               # Shell HTML, CSS custom properties, PWA/OG meta tags
  app.js                   # Bundled output (gitignored; run `bun run build` to generate)
  manifest.json            # PWA web app manifest
  apple-touch-icon.png     # iOS home screen icon (180×180)
  og-image.png             # Open Graph / iMessage preview image (1200×1200)

scripts/
  generate-icons.js        # Regenerates all PNGs (em dash in a squircle) from SVG via sharp

tests/                     # Playwright E2E tests (uv run pytest)
```

**Data flow**

`<em-dash>` is the single source of truth. It loads the list from `localStorage` on startup (via `migrateList`) and passes it down to child components as properties. Children never write to storage directly — they fire custom events (`add-item`, `remove-item`, `rename-item`, `move-item`, `add-aisle`, `rename-aisle`, `delete-aisle`) which `<em-dash>` handles, mutates its reactive `_list` state, and persists with `_save()`.

Add history (`emdash-history` in `localStorage`) follows the same pattern through `_history` reactive state, updated by `_recordHistory()` and `_removeHistoryItem()`.

**Auto-assignment**

When an item is added, `findAisleLabel()` scans `aisle-defaults.js` for the best-matching aisle label. String keys match as substrings; RegExp keys match non-anchored. The longest match wins, which lets specific entries like `"canned tomatoes"` beat the shorter `"tomatoes"`. If the matched aisle doesn't exist yet, it is created automatically.

Familect terms (e.g. "Turg", "Silkenhalf") are resolved to their canonical product description via `lookupFamilect()` before the aisle lookup, so the auto-assignment uses the canonical name while the list stores and displays the original shorthand.

**Testing**

```bash
bun test          # unit tests (utils, aisle-defaults, familect, share-button)
uv run pytest     # E2E tests in tests/ (starts its own dev server on :3000 via conftest.py)
```

### Upstream

Em Dash is a fork of a sibling app that shares the same code. The `upstream` remote points at it, so shared fixes can be brought over with `git fetch upstream && git cherry-pick <sha>`. Expect conflicts on branding lines: names, wording, colours and icons.

## Deployment

Push to a repo connected to Render. The `render.yaml` handles the rest.

## Licence

[Blue Oak Model License 1.0.0](LICENSE.md)
