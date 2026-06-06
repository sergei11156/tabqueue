# TabQueue

TabQueue is a Chrome Extension Manifest V3 recent-tab switcher. It tracks the Chrome tabs you used most recently across all Chrome windows and shows an app-switcher style overlay so you can jump back to them by number or keyboard selection.

## Install

1. Build the extension:

   ```sh
   npm install
   npm run build
   ```

2. Open `chrome://extensions`.
3. Enable Developer Mode.
4. Click Load unpacked.
5. Select the `dist/` folder from this project.

## Shortcuts

Open `chrome://extensions/shortcuts` to configure shortcuts.

The suggested macOS shortcut for opening the overlay is Command+Shift+Space. Chrome rejects Option+Command+Space as a manifest default, so use `chrome://extensions/shortcuts` if you want to try another available combination manually. The cross-platform suggested shortcut is Alt+Shift+Space.

The extension also defines commands for:

- `switch-to-recent-tab-1`
- `switch-to-recent-tab-2`
- `switch-to-recent-tab-3`
- `switch-to-recent-tab-4`
- `switch-to-recent-tab-5`
- `switch-to-recent-tab-6`
- `switch-to-recent-tab-7`
- `switch-to-recent-tab-8`
- `switch-to-recent-tab-9`
- `switch-to-recent-tab-10`

Bind these manually if Chrome allows the key combinations you want. Shortcuts such as Command+1 through Command+0 can conflict with Chrome's built-in tab-position shortcuts.

## How It Works

- Tab history is tracked globally across all Chrome windows.
- Recent tab history is persisted for the browser session with `chrome.storage.session`, so it can recover when Chrome restarts the Manifest V3 background service worker.
- The active tab is stored in history, but switcher candidates exclude the current tab, so slot 1 means the previous tab.
- Selecting a tab from another Chrome window activates that tab and focuses its window.
- The overlay renders inside the currently active page using a content script.
- System tabs such as `chrome://extensions` can be tracked and switched to, but they cannot host the overlay.

## Chrome Limitations

- Extensions cannot detect a bare Command key press.
- Extensions cannot draw directly on Chrome's native tab strip.
- Chrome may reject or reserve shortcut combinations, especially built-in browser shortcuts.
- Content scripts cannot run on Chrome internal pages such as `chrome://extensions`, so the overlay cannot open while one of those pages is active.
- History is persisted for the active browser session. Full browser restart persistence is intentionally out of scope because Chrome tab ids are not stable across restarts.

## Development

```sh
npm install
npm run build
npm run typecheck
npm test
npm run validate:dist
npm run test:e2e
```

If your local Chromium build does not expose extension service workers in headless mode, run the browser test headed:

```sh
HEADED=1 npm run test:e2e
```

## Manual Smoke Test

1. Run `npm run build`.
2. Load `dist/` as an unpacked extension in Chrome.
3. Open several normal web pages in one Chrome window.
4. Visit the tabs in a known order.
5. Trigger the open-overlay shortcut.
6. Confirm slot 1 is the previous non-current tab across all Chrome windows.
7. Press ArrowUp or ArrowDown and confirm the highlighted item changes.
8. Press Enter and confirm the highlighted tab activates.
9. Press 1 through 9 or 0 while the overlay is open and confirm the matching tab activates.
10. Confirm Escape, outside click, and timeout close the overlay.
11. Open a second Chrome window, activate a tab there, return to the first window, and confirm the second-window tab appears in the overlay.
12. Select the second-window tab and confirm Chrome focuses that window.
13. Visit `chrome://extensions`, then return to a normal tab and confirm the system tab appears as a switch target.
14. Open `chrome://extensions` as the active tab and confirm triggering the overlay fails gracefully.
15. Leave Chrome idle long enough for the extension service worker to restart, then confirm recent session history is still available.
