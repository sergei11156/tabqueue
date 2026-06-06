# TabQueue

TabQueue is a Chrome Extension Manifest V3 recent-tab switcher. It tracks the tabs you used most recently per Chrome window and shows an app-switcher style overlay so you can jump back to the previous tabs by number.

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

- Tab history is tracked in memory by the Manifest V3 background service worker.
- Each Chrome window has its own recent tab history.
- The active tab is stored in history, but switcher candidates exclude the current tab, so slot 1 means the previous tab.
- The overlay renders inside the currently active page using a content script.
- System tabs such as `chrome://extensions` can be tracked and switched to, but they cannot host the overlay.

## Chrome Limitations

- Extensions cannot detect a bare Command key press.
- Extensions cannot draw directly on Chrome's native tab strip.
- Chrome may reject or reserve shortcut combinations, especially built-in browser shortcuts.
- Content scripts cannot run on Chrome internal pages such as `chrome://extensions`, so the overlay cannot open while one of those pages is active.
- The first version keeps history in memory. If Chrome suspends the service worker or the browser restarts, history rebuilds as you activate tabs again.

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
6. Confirm slot 1 is the previous non-current tab.
7. Press 1 through 9 or 0 while the overlay is open and confirm the matching tab activates.
8. Confirm Escape, outside click, and timeout close the overlay.
9. Visit `chrome://extensions`, then return to a normal tab and confirm the system tab appears as a switch target.
10. Open `chrome://extensions` as the active tab and confirm triggering the overlay fails gracefully.
11. Open a second Chrome window and confirm its recent tab list is independent.
