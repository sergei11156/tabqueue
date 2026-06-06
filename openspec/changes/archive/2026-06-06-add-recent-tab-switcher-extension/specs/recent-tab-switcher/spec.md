## ADDED Requirements

### Requirement: Per-window recent tab history

The extension SHALL maintain a recently active tab history independently for each Chrome window.

#### Scenario: Activated tab becomes most recent

- **WHEN** the user activates a tab in a Chrome window
- **THEN** the extension stores that tab at the front of that window's recent tab history with tab id, window id, title, url, and favicon URL when available

#### Scenario: Existing tab activation avoids duplicates

- **WHEN** the user activates a tab that already exists in that window's recent tab history
- **THEN** the extension moves the existing tab entry to the front instead of storing a duplicate

#### Scenario: Windows keep separate histories

- **WHEN** the user activates tabs in two different Chrome windows
- **THEN** each window's recent tab history contains only tabs from that same window

### Requirement: Tab lifecycle cleanup

The extension SHALL keep recent tab history consistent when tabs are closed, refreshed, updated, or replaced.

#### Scenario: Closed tab is removed

- **WHEN** a tab is closed
- **THEN** the extension removes that tab from recent tab history

#### Scenario: Updated tab metadata is refreshed

- **WHEN** a tracked tab changes title, URL, or favicon
- **THEN** the extension updates the stored tab metadata for that tab

#### Scenario: Replaced tab does not leave a stale entry

- **WHEN** Chrome reports that a tracked tab has been replaced by a new tab id
- **THEN** the extension removes or updates the stale tab id so switch commands do not target a missing tab

### Requirement: Command registration

The extension SHALL define Chrome commands for opening the tab switcher and for switching to recent tab slots 1 through 10.

#### Scenario: Open switcher command exists

- **WHEN** the extension manifest is loaded
- **THEN** the manifest defines an `open-tab-switcher` command with a Chrome-valid macOS suggested shortcut of `Command+Shift+Space`

#### Scenario: Direct switch commands exist

- **WHEN** the extension manifest is loaded
- **THEN** the manifest defines `switch-to-recent-tab-1`, `switch-to-recent-tab-2`, `switch-to-recent-tab-3`, `switch-to-recent-tab-4`, `switch-to-recent-tab-5`, `switch-to-recent-tab-6`, `switch-to-recent-tab-7`, `switch-to-recent-tab-8`, `switch-to-recent-tab-9`, and `switch-to-recent-tab-10`

#### Scenario: Manual shortcut configuration is supported

- **WHEN** Chrome does not accept or reserve a desired shortcut such as `Command+1`
- **THEN** the user can still configure available extension commands manually through Chrome's extension shortcuts page

### Requirement: Overlay candidate list

The extension SHALL show up to 10 recently used non-current tabs from the current Chrome window when the tab switcher opens.

#### Scenario: Overlay excludes the current tab

- **WHEN** the user opens the tab switcher from an active tab
- **THEN** slot 1 represents the most recently active tab in the same window other than the current active tab

#### Scenario: Overlay lists available metadata

- **WHEN** the overlay is shown
- **THEN** each item displays its slot number, favicon when available, tab title, and shortened URL or domain

#### Scenario: Overlay does not cross windows

- **WHEN** the current Chrome window has recent tab history and another Chrome window has separate recent tab history
- **THEN** the overlay lists only candidates from the current Chrome window

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

### Requirement: Recent tab slot switching

The extension SHALL switch to the selected recent tab slot in the current Chrome window using `chrome.tabs.update(tabId, { active: true })`.

#### Scenario: Direct slot command switches tabs

- **WHEN** the user triggers `switch-to-recent-tab-1`
- **THEN** the extension activates the most recently active non-current tab in the current Chrome window

#### Scenario: Overlay selection switches tabs

- **WHEN** the overlay is visible and the user selects a listed item
- **THEN** the extension closes the overlay and activates the selected tab

#### Scenario: Missing selected tab is ignored

- **WHEN** the user selects or commands a slot whose tab no longer exists
- **THEN** the extension removes the stale tab from history and does not switch windows or activate an unrelated tab

### Requirement: Restricted page handling

The extension SHALL handle pages where content scripts cannot run without throwing visible errors or breaking history.

#### Scenario: Active page cannot host overlay

- **WHEN** the user triggers `open-tab-switcher` from a restricted page such as a Chrome internal page
- **THEN** the extension fails gracefully by not rendering the overlay and not disrupting the active tab

#### Scenario: Restricted pages are not unsafe injection targets

- **WHEN** the active tab URL uses a restricted scheme or extension-inaccessible page type
- **THEN** the extension does not attempt unsafe overlay rendering into that page

#### Scenario: Restricted pages remain switchable

- **WHEN** recent tab history includes a tab with a restricted scheme or extension-inaccessible page type
- **THEN** the extension can include that tab in overlay and direct slot switch candidates

### Requirement: README documentation

The extension SHALL document installation, shortcut configuration, and known Chrome limitations.

#### Scenario: Installation is documented

- **WHEN** a user reads the README
- **THEN** it explains loading the unpacked extension through `chrome://extensions`, Developer Mode, Load unpacked, and selecting the extension folder

#### Scenario: Shortcut limitations are documented

- **WHEN** a user reads the README
- **THEN** it explains that extensions cannot detect a bare Command key press, cannot draw on Chrome's native tab strip, may conflict with shortcuts such as `Command+1`, and cannot run content scripts on Chrome internal pages

### Requirement: Automated validation

The extension SHALL include automated tests for core history behavior and extension integration behavior.

#### Scenario: History logic is unit tested

- **WHEN** the test suite runs
- **THEN** unit tests validate duplicate removal, per-window separation, closed-tab cleanup, metadata updates, and current-tab exclusion from switch candidates

#### Scenario: Extension behavior is end-to-end tested

- **WHEN** the end-to-end test suite runs
- **THEN** Playwright loads the built unpacked extension in Chromium and verifies overlay rendering and tab switching behavior through extension-accessible triggers
