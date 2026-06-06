## 1. Permissions And Types

- [x] 1.1 Add the `storage` permission to the Manifest V3 manifest.
- [x] 1.2 Extend shared tab item types with window context needed by the overlay.
- [x] 1.3 Define a serialized history shape and storage key for `chrome.storage.session`.

## 2. Global Persistent History

- [x] 2.1 Replace the per-window history store with a global MRU history store.
- [x] 2.2 Preserve each tab's `windowId` while ordering all tabs by global activation recency.
- [x] 2.3 Persist history changes to `chrome.storage.session`.
- [x] 2.4 Rehydrate history from `chrome.storage.session` when the background service worker starts.
- [x] 2.5 Query live tabs after rehydration, prune stale tab ids, and refresh title, URL, favicon, and window id metadata.
- [x] 2.6 Ensure system/restricted tabs remain in history and candidates.

## 3. Global Switching

- [x] 3.1 Update overlay candidate resolution to return global non-current candidates instead of current-window candidates.
- [x] 3.2 Update direct slot commands to resolve against the global candidate list.
- [x] 3.3 Allow selected tabs from other windows instead of removing them as cross-window entries.
- [x] 3.4 Activate the selected tab and focus the selected tab's Chrome window when the target is in another window.
- [x] 3.5 Remove stale entries when selected tabs no longer exist without activating unrelated tabs.

## 4. Overlay Keyboard Navigation

- [x] 4.1 Display window context for each overlay candidate.
- [x] 4.2 Maintain a selected overlay index with slot 1 selected by default.
- [x] 4.3 Implement ArrowDown and ArrowUp navigation with wrapping.
- [x] 4.4 Implement Enter to accept the currently selected item.
- [x] 4.5 Keep existing number-key slot selection behavior.
- [x] 4.6 Update selected item styling and `aria-selected` state as keyboard selection changes.

## 5. Documentation

- [x] 5.1 Update README behavior notes to describe global-only switching across Chrome windows.
- [x] 5.2 Document that history is persisted for the browser session through `chrome.storage.session`.
- [x] 5.3 Update manual smoke tests for cross-window switching, worker restart recovery, and ArrowUp/ArrowDown/Enter navigation.

## 6. Validation

- [x] 6.1 Add unit tests for global cross-window MRU ordering and current-tab exclusion.
- [x] 6.2 Add unit tests for storage serialization, rehydration, stale-entry pruning, and metadata refresh.
- [x] 6.3 Add content/overlay tests or E2E assertions for ArrowUp, ArrowDown, Enter, and number-key selection.
- [x] 6.4 Add Playwright E2E coverage for global overlay candidates from multiple windows.
- [x] 6.5 Add Playwright E2E coverage for selecting a tab in another window and focusing that window.
- [x] 6.6 Run typecheck, unit tests, build validation, and headed E2E tests.
