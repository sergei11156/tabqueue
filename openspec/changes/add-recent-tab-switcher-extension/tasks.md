## 1. Project Setup

- [x] 1.1 Create `package.json` with build, typecheck, unit test, and end-to-end test scripts.
- [x] 1.2 Add TypeScript, esbuild, Chrome type definitions, Vitest, and Playwright as development dependencies.
- [x] 1.3 Add `tsconfig.json` and an esbuild build script that outputs the extension into `dist/`.
- [x] 1.4 Create the extension source structure for background, content script, overlay CSS, shared types, tests, and static manifest assets.

## 2. Manifest And Commands

- [x] 2.1 Add `manifest.json` for Manifest V3 with background service worker, required permissions, and extension metadata.
- [x] 2.2 Define `open-tab-switcher` and `switch-to-recent-tab-1` through `switch-to-recent-tab-10` in the manifest commands section.
- [x] 2.3 Configure the macOS open-overlay shortcut as `Command+Shift+Space`, plus a safe cross-platform fallback.
- [x] 2.4 Leave direct slot shortcuts configurable by the user when Chrome conflicts with built-in shortcuts.

## 3. Recent Tab History

- [x] 3.1 Implement shared `TabSnapshot` and message types for background/content communication.
- [x] 3.2 Implement a pure per-window MRU history store with duplicate removal, front insertion, candidate limiting, and current-tab exclusion.
- [x] 3.3 Add restricted URL detection for `chrome://`, `edge://`, `about:`, extension pages, and other extension-inaccessible pages.
- [x] 3.4 Wire background listeners for tab activation, update, removal, replacement, and window cleanup.
- [x] 3.5 Refresh stored title, URL, and favicon metadata when tracked tabs change.

## 4. Switching Behavior

- [x] 4.1 Implement command handling in the MV3 background service worker.
- [x] 4.2 Resolve slot commands against recent non-current candidates from the active Chrome window only.
- [x] 4.3 Activate selected tabs with `chrome.tabs.update(tabId, { active: true })`.
- [x] 4.4 Remove stale history entries and do nothing when a selected tab no longer exists.
- [x] 4.5 Ensure switching through the extension naturally updates MRU history without cross-window switching.

## 5. Overlay Rendering

- [x] 5.1 Implement programmatic content script and CSS injection for supported active pages.
- [x] 5.2 Render a centered dark translucent app-switcher overlay with numbered items, favicon fallback, title, and shortened URL/domain.
- [x] 5.3 Add keyboard-friendly selection handling for slots 1 through 9 and 0 as slot 10 while the overlay is visible.
- [x] 5.4 Close the overlay after selection, Escape, outside click, or a five-second inactivity timeout.
- [x] 5.5 Handle injection or messaging failure on restricted pages gracefully without visible errors.

## 6. Documentation

- [x] 6.1 Write README installation instructions for `chrome://extensions`, Developer Mode, Load unpacked, and selecting `dist/`.
- [x] 6.2 Document shortcut configuration through `chrome://extensions/shortcuts`, including manual binding for direct slot commands.
- [x] 6.3 Explain Chrome limitations: no bare Command detection, no native tab strip drawing, shortcut conflicts, and no content scripts on Chrome internal pages.
- [x] 6.4 Document how to build, run unit tests, run end-to-end tests, and perform manual shortcut smoke testing.

## 7. Validation

- [x] 7.1 Add Vitest coverage for duplicate removal, per-window history separation, tab cleanup, metadata updates, restricted URL switchability, and current-tab exclusion.
- [x] 7.2 Add build validation that the generated `dist/manifest.json` and scripts are loadable as an unpacked MV3 extension.
- [x] 7.3 Add Playwright end-to-end tests that load Chromium with the unpacked extension, activate multiple tabs in a known order, open the overlay, and verify rendered candidates.
- [x] 7.4 Add Playwright end-to-end tests that switch via overlay selection and direct slot behavior without crossing windows.
- [x] 7.5 Add a manual smoke checklist for verifying actual Chrome shortcut bindings on macOS and other platforms.
