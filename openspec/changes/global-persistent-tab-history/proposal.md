## Why

The switcher currently loses its recent-tab memory when the Manifest V3 background service worker is suspended or restarted, and it only switches within the current Chrome window. Users expect an Alt-Tab/Cmd-Tab style tab switcher to remember recent tabs across worker restarts and to jump to the most recently used Chrome tab even when that tab is in another window.

## What Changes

- **BREAKING**: Replace current-window-only switching with global-only recent tab switching across all Chrome windows.
- Persist recent tab history in `chrome.storage.session` so the extension can recover MRU state after MV3 service worker suspension or restart.
- Rehydrate persisted history on background startup and prune stale tab ids against currently open tabs.
- Keep system/restricted tabs switchable while still preventing overlay injection into restricted active pages.
- Update the overlay to show whether each candidate is in the current window or another window.
- When selecting a tab in another Chrome window, activate the tab and focus its window.
- Add keyboard navigation inside the overlay: ArrowUp/ArrowDown move the selected item, and Enter accepts the selected item.
- Update tests and documentation to cover global switching, persisted history recovery, and keyboard navigation.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `recent-tab-switcher`: Change history from per-window memory-only MRU to persisted global MRU, allow cross-window switching, and add arrow/Enter overlay navigation.

## Impact

- Updates background history storage and startup lifecycle behavior.
- Adds use of `chrome.storage.session`, requiring the `storage` permission.
- Changes overlay candidate semantics from current-window candidates to global candidates.
- Updates tab activation logic to focus target windows for cross-window selections.
- Updates unit and Playwright E2E coverage for global MRU, persistence, and keyboard navigation.
