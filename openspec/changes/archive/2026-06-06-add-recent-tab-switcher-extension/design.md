## Context

This project is starting as a Chrome Extension Manifest V3 codebase. The extension should feel like an app switcher for Chrome tabs: users open an overlay, see the most recently used tabs for the current Chrome window, and jump to a numbered slot.

Chrome imposes several product-shaping constraints:

- Extension commands cannot detect a bare modifier key press such as Command alone.
- Command shortcuts are configured through `chrome.commands` and may be rejected or overridden when they conflict with Chrome or operating system shortcuts.
- Chrome allows many command definitions, but only a small number of suggested default shortcuts; users can manually bind the rest in `chrome://extensions/shortcuts`.
- Content scripts run in web pages, not in privileged browser pages such as `chrome://` URLs.
- Manifest V3 background code runs in a service worker, so the implementation should tolerate worker suspension and keep state minimal.

## Goals / Non-Goals

**Goals:**

- Build a minimal production-friendly MV3 extension in TypeScript.
- Track recently active tabs independently per Chrome window.
- Render an app-switcher-style overlay in the active tab when the open-switcher command runs.
- Make slot `1` represent the most recently used non-current tab, matching Alt-Tab/Cmd-Tab expectations.
- Support direct command switching for slots 1 through 10.
- Handle closed, refreshed, replaced, and restricted tabs gracefully.
- Provide focused unit tests for tab history logic and Playwright end-to-end tests for the loaded extension.
- Document installation, shortcut configuration, and Chrome limitations clearly.

**Non-Goals:**

- Detect a standalone Command or Option key press.
- Override Chrome's native tab strip, draw on browser chrome, or replace built-in Chrome shortcuts.
- Persist long-term tab history across browser restarts in the first version.
- Add external runtime UI frameworks or dependencies.
- Support cross-window tab switching.

## Decisions

### Use TypeScript With A Small Build

Use TypeScript source files under `src/` and build the extension into `dist/`. Use `esbuild` for a small compile/bundle step and keep runtime code dependency-free.

Alternatives considered:

- Plain JavaScript: simpler build, but weaker contracts around Chrome API messages and tab snapshots.
- Framework-based extension tooling: faster scaffolding, but too much machinery for a small MV3 extension.

### Keep Tab History In Memory

The background service worker will maintain an in-memory `Map<windowId, TabSnapshot[]>`, where each snapshot contains tab id, window id, title, url, and optional favicon. Activation events move a tab to the front after removing any duplicate. Tab lifecycle events update or remove existing snapshots.

The first version will not use `chrome.storage.local` for normal operation. If service worker suspension clears memory, history will rebuild as tabs are activated again.

Alternatives considered:

- Persisting every history update to `chrome.storage.local`: more durable, but adds lifecycle complexity and stale data concerns.
- Querying all tabs on every shortcut: simpler state, but cannot reliably infer recent activation order.

### Expose Candidates As Recent Non-Current Tabs

The history store will include the current active tab, because activation events naturally make it the newest entry. Overlay and slot-switching candidates will filter out the current active tab before taking the first 10 items.

This means slot `1` switches to the previous tab, which better matches app-switcher muscle memory.

Alternatives considered:

- Show the current tab as item `1`: technically direct, but makes the first shortcut a no-op and feels unlike Alt-Tab/Cmd-Tab.

### Use Commands For All Keyboard Entry Points

The manifest will define:

- `open-tab-switcher`
- `switch-to-recent-tab-1` through `switch-to-recent-tab-10`

The macOS suggested shortcut for opening the overlay is `Command+Shift+Space`, with a cross-platform fallback of `Alt+Shift+Space`. `Option+Command+Space` was considered, but Chrome rejects it as a manifest default. Direct slot commands should be defined but left for manual user binding where Chrome conflicts with built-in shortcuts.

Alternatives considered:

- A content-script keydown listener for global shortcuts: cannot work reliably across tabs and cannot detect keys when the page is not focused.
- A popup-only UI: avoids content-script restrictions, but is less like an app switcher.

### Render Overlay Via Programmatic Content Script Messaging

When `open-tab-switcher` runs, the service worker will get the active tab and candidates for its window, then ensure the content script/CSS is available in that tab using `chrome.scripting` if needed. It will send a runtime message containing the candidate list.

The content script will create and own the DOM overlay, keyboard handling, outside-click dismissal, and timeout. Selecting an item sends a message back to the service worker to switch to the selected tab.

Restricted/internal URLs can be tracked and used as switch targets, but they cannot host the overlay. If the active page is restricted, opening the overlay fails gracefully without a popup fallback.

Alternatives considered:

- Static content script on all pages: simpler messaging, but injects code into every page even when the switcher is rarely used.
- Extension popup fallback as primary UI: useful later, but not necessary for the initial app-switcher flow.

### Test In Layers

The MRU history module should be pure TypeScript and covered with unit tests. End-to-end tests should use Playwright to launch Chromium with the unpacked extension from `dist/`, open several tabs, activate them in a known order, open the overlay through an extension-facing trigger, and verify switching behavior.

Actual OS/browser shortcut bindings should be covered by a manual smoke checklist, because Chrome-reserved shortcuts and command dispatch from synthetic keypresses are not fully reliable in automated browser tests.

## Risks / Trade-offs

- Chrome rejects or overrides desired shortcuts -> Provide safe defaults where possible and document manual setup in `chrome://extensions/shortcuts`.
- Background service worker memory is lost -> Accept for v1 and rebuild history from future tab activations; consider `chrome.storage.local` later if persistence becomes important.
- Overlay cannot open on restricted pages -> Detect injection/message failures and fail gracefully; keep those pages switchable from normal pages.
- Page CSS conflicts with overlay -> Use a unique root id, Shadow DOM if practical, and scoped CSS.
- Favicons may be unavailable or broken -> Render a fallback icon/placeholder without affecting switching.
- Automated shortcut tests are flaky -> Test command-equivalent extension flows in Playwright and keep manual shortcut verification in README.

## Migration Plan

This is a new extension, so no data migration is required. Implementation can start from an empty repository state and produce a loadable unpacked extension in `dist/`.

Rollback is deleting or disabling the unpacked extension from `chrome://extensions`.

## Open Questions

- None for v1.
