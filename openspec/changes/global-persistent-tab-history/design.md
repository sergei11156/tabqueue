## Context

The current extension stores recent tab history in an in-memory `RecentTabHistory` instance inside the Manifest V3 background service worker. That makes the switcher fast, but the state is lost whenever Chrome suspends or restarts the worker. The current capability also scopes candidates and direct slot switching to the active Chrome window, which conflicts with the intended Alt-Tab/Cmd-Tab feel.

This change intentionally shifts the product model to global-only switching. A recent tab is recent regardless of which Chrome window owns it, and selecting a tab in another window should focus that window.

## Goals / Non-Goals

**Goals:**

- Replace per-window MRU candidates with one global MRU list across all Chrome windows.
- Persist global MRU state through MV3 service worker suspension/restart using `chrome.storage.session`.
- Rehydrate state on worker startup, prune stale tab ids, and refresh available tab metadata.
- Keep system/restricted tabs switchable while preventing overlay injection into restricted active pages.
- Show enough window context in the overlay for cross-window candidates to feel intentional.
- Add ArrowUp/ArrowDown selection movement and Enter acceptance in the overlay.
- Preserve direct slot commands 1 through 10 against the same global candidate list.

**Non-Goals:**

- Provide a current-window-only mode or a separate toggle in this change.
- Persist MRU history across full browser restarts with `chrome.storage.local`.
- Reconstruct exact MRU order for tabs that existed before the extension was installed or before any persisted state exists.
- Render an overlay on restricted active pages.

## Decisions

### Use One Global MRU Store

Replace `Map<windowId, TabSnapshot[]>` as the primary model with a single ordered `TabSnapshot[]`. Each snapshot still contains `windowId`, so the overlay can mark whether an item is in the current window or another window.

Alternatives considered:

- Keep per-window histories and merge them when opening the overlay. This cannot reliably produce global recency without a separate global ordering.
- Support both global and per-window modes. This is more flexible, but it adds UX and shortcut complexity before the global model is validated.

### Persist To `chrome.storage.session`

Use `chrome.storage.session` to store the serialized global MRU list after updates. This survives service worker restarts during the browser session without trying to preserve tab ids across browser restarts.

On service worker startup:

1. Load persisted history from `chrome.storage.session`.
2. Query currently open tabs.
3. Prune missing tab ids.
4. Refresh title, URL, favicon, and window id from live tab data.
5. Record currently active tabs for windows when needed without destroying persisted order.

Alternatives considered:

- `chrome.storage.local`: survives browser restarts, but tab ids are not stable across restarts and stale entries become more likely.
- Memory only: current behavior, too easy to lose state.

### Keep System Tabs Switchable

Restricted URLs such as `chrome://extensions` stay in global MRU and can appear as candidates. The restriction applies only to overlay hosting: if the active tab cannot run a content script, the overlay command fails gracefully.

### Cross-window Switching Focuses The Target Window

When a selected tab is in another Chrome window, the extension will activate that tab and focus its window. The implementation should verify the tab still exists before switching and should remove stale entries when it does not.

Candidate switching should use the selected tab's real `windowId`, not the active tab's window id, so cross-window entries are not accidentally removed.

### Overlay Selection State

The overlay should maintain a selected index. Slot `1` starts selected by default. ArrowDown advances the selection, ArrowUp moves it backward, both wrapping at list boundaries. Enter selects the current item. Number keys keep their current direct slot behavior.

Each row should expose visual selected state and `aria-selected` updates so the keyboard state is visible and testable.

## Risks / Trade-offs

- Persisted history can contain stale tab ids -> Prune against `chrome.tabs.query({})` on startup and remove entries when `chrome.tabs.get` fails.
- Storage writes can be frequent -> Debounce or coalesce persistence after history mutations if needed; initial implementation can write after meaningful mutations because list size is small.
- Service worker startup can race with commands -> Ensure history initialization is awaited before computing candidates or switching slots.
- Cross-window focus may feel surprising -> Show window context in the overlay for candidates outside the current window.
- Restricted active pages still cannot host overlay -> Keep graceful no-op behavior and document that system tabs remain switchable from normal pages.

## Migration Plan

No user data migration is required. Existing in-memory history will be replaced at runtime by the new global store. On extension update, history starts empty unless session storage already contains a compatible key from a prior version.

Rollback is returning to the previous in-memory per-window implementation and removing the `storage` permission.

## Open Questions

- None for v1 of this change.
