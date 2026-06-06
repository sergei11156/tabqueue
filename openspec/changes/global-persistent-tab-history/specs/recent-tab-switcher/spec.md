## MODIFIED Requirements

### Requirement: Per-window recent tab history

The extension SHALL maintain a global recently active tab history across all Chrome windows while preserving each tab's owning window id.

#### Scenario: Activated tab becomes most recent

- **WHEN** the user activates a tab in any Chrome window
- **THEN** the extension stores that tab at the front of the global recent tab history with tab id, window id, title, url, and favicon URL when available

#### Scenario: Existing tab activation avoids duplicates

- **WHEN** the user activates a tab that already exists in global recent tab history
- **THEN** the extension moves the existing tab entry to the front instead of storing a duplicate

#### Scenario: Windows contribute to one global history

- **WHEN** the user activates tabs in two different Chrome windows
- **THEN** the extension orders those tabs in one global recent tab history by activation recency

#### Scenario: Service worker restart restores session history

- **WHEN** the Manifest V3 background service worker restarts during a browser session
- **THEN** the extension restores recent tab history from `chrome.storage.session`

#### Scenario: Restored history is pruned against live tabs

- **WHEN** stored recent tab history contains a tab id that is no longer open
- **THEN** the extension removes that stale entry before showing candidates or switching slots

### Requirement: Overlay candidate list

The extension SHALL show up to 10 recently used non-current tabs from all Chrome windows when the tab switcher opens.

#### Scenario: Overlay excludes the current tab

- **WHEN** the user opens the tab switcher from an active tab
- **THEN** slot 1 represents the most recently active tab other than the current active tab, even if that tab is in another Chrome window

#### Scenario: Overlay lists available metadata

- **WHEN** the overlay is shown
- **THEN** each item displays its slot number, favicon when available, tab title, shortened URL or domain, and window context

#### Scenario: Overlay includes other windows

- **WHEN** the global recent tab history contains tabs from the current Chrome window and another Chrome window
- **THEN** the overlay can list candidates from both windows in global recency order

### Requirement: App-switcher overlay behavior

The extension SHALL render a keyboard-friendly centered overlay in the active page when the open switcher command is triggered.

#### Scenario: Overlay opens in active tab

- **WHEN** the user triggers `open-tab-switcher` on a supported page
- **THEN** the active page displays a centered dark translucent overlay with rounded corners and clearly selectable items

#### Scenario: Escape dismisses overlay

- **WHEN** the overlay is visible and the user presses Escape
- **THEN** the overlay closes without switching tabs

#### Scenario: Outside click dismisses overlay

- **WHEN** the overlay is visible and the user clicks outside it
- **THEN** the overlay closes without switching tabs

#### Scenario: Inactivity timeout dismisses overlay

- **WHEN** the overlay is visible and the user takes no action for the configured timeout
- **THEN** the overlay closes automatically

#### Scenario: Arrow keys move selection

- **WHEN** the overlay is visible and the user presses ArrowDown or ArrowUp
- **THEN** the overlay moves the selected item forward or backward through the candidate list

#### Scenario: Enter accepts selected item

- **WHEN** the overlay is visible and the user presses Enter
- **THEN** the extension switches to the currently selected item

### Requirement: Recent tab slot switching

The extension SHALL switch to the selected recent tab slot globally using `chrome.tabs.update(tabId, { active: true })` and SHALL focus the selected tab's Chrome window when needed.

#### Scenario: Direct slot command switches tabs

- **WHEN** the user triggers `switch-to-recent-tab-1`
- **THEN** the extension activates the most recently active non-current tab from the global recent tab history

#### Scenario: Overlay selection switches tabs

- **WHEN** the overlay is visible and the user selects a listed item
- **THEN** the extension closes the overlay and activates the selected tab

#### Scenario: Cross-window selection focuses target window

- **WHEN** the selected tab belongs to a Chrome window other than the current window
- **THEN** the extension activates the selected tab and focuses the selected tab's window

#### Scenario: Missing selected tab is ignored

- **WHEN** the user selects or commands a slot whose tab no longer exists
- **THEN** the extension removes the stale tab from history and does not activate an unrelated tab

### Requirement: Automated validation

The extension SHALL include automated tests for core history behavior, persistence behavior, keyboard overlay behavior, and extension integration behavior.

#### Scenario: History logic is unit tested

- **WHEN** the test suite runs
- **THEN** unit tests validate duplicate removal, global cross-window ordering, tab cleanup, metadata updates, storage restoration, stale-entry pruning, and current-tab exclusion from switch candidates

#### Scenario: Overlay keyboard navigation is tested

- **WHEN** the test suite runs
- **THEN** tests validate ArrowUp, ArrowDown, and Enter behavior for overlay selection

#### Scenario: Extension behavior is end-to-end tested

- **WHEN** the end-to-end test suite runs
- **THEN** Playwright loads the built unpacked extension in Chromium and verifies global overlay rendering, cross-window tab switching, and persisted history recovery through extension-accessible triggers
