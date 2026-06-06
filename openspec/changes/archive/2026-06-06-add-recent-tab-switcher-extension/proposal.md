## Why

Chrome's built-in tab switching is position-based, while many users want an app-switcher style workflow that jumps between the tabs they actually used most recently. This change introduces a Chrome Manifest V3 extension that provides a per-window recent-tab switcher with a keyboard-driven overlay.

## What Changes

- Add a Chrome Extension Manifest V3 implementation for switching among recently used tabs.
- Track recently active tabs independently per Chrome window, keeping enough tab metadata to render a useful switcher list.
- Add command-based shortcuts for opening the switcher overlay and switching to recent tab slots 1 through 10.
- Use a Chrome-valid macOS suggested shortcut of `Command+Shift+Space` for opening the overlay, with documented manual configuration in `chrome://extensions/shortcuts` for users who want to try other available combinations.
- Render a centered, dark, app-switcher-style overlay in the active tab showing up to 10 recent tabs with number, favicon, title, and shortened URL/domain.
- Close the overlay after selection, Escape, outside click, or a short inactivity timeout.
- Handle Chrome extension constraints gracefully, including restricted pages where content scripts cannot run and shortcut conflicts with browser or operating system shortcuts.
- Implement the extension in TypeScript with a minimal build, no runtime libraries, focused unit tests for history behavior, and end-to-end tests for the loaded extension.

## Capabilities

### New Capabilities

- `recent-tab-switcher`: Tracks per-window recently used Chrome tabs and provides keyboard-driven overlay and direct-slot switching behavior.

### Modified Capabilities

- None.

## Impact

- Adds a new TypeScript Chrome extension codebase with Manifest V3 background service worker, content script overlay, CSS, and README documentation.
- Adds build and test tooling for compiling TypeScript and validating core behavior.
- Uses Chrome extension APIs: `chrome.tabs`, `chrome.windows`, `chrome.commands`, `chrome.runtime`, and `chrome.scripting`.
- Adds Playwright-based end-to-end coverage for loading the unpacked extension and exercising tab-switcher behavior, with manual shortcut verification documented for Chrome-reserved shortcuts.
