import { RecentTabHistory } from "./history";
import { loadStoredHistory, saveStoredHistory } from "./storage";
import type { BackgroundMessage, ContentMessage, TabSnapshot } from "./types";
import { isRestrictedUrl } from "./url";

const OVERLAY_TIMEOUT_MS = 5000;
const SWITCH_COMMAND_PREFIX = "switch-to-recent-tab-";

const history = new RecentTabHistory();
const ready = initializeHistory();

declare global {
  // Playwright evaluates inside the extension service worker; this hook lets E2E
  // tests trigger command-equivalent behavior without relying on real shortcuts.
  var __tabqueueTest: {
    openOverlay: () => Promise<void>;
    switchToSlot: (slot: number) => Promise<void>;
  };
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  void (async () => {
    await ready;
    await recordTabById(activeInfo.tabId);
  })();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!("title" in changeInfo) && !("url" in changeInfo) && !("favIconUrl" in changeInfo)) {
    return;
  }

  if (tab.active && tab.id !== undefined && tab.windowId !== undefined) {
    const snapshot = toSnapshot(tab);
    if (snapshot) {
      void recordAndPersist(snapshot);
    }
    return;
  }

  void updateAndPersist({
    id: tabId,
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void removeAndPersist(tabId);
});

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  void (async () => {
    await ready;
    const addedTab = await getTab(addedTabId);
    const snapshot = addedTab ? toSnapshot(addedTab) : undefined;

    if (snapshot) {
      history.replace(removedTabId, snapshot);
      await persistHistory();
      return;
    }

    await removeAndPersist(removedTabId);
  })();
});

chrome.windows.onRemoved.addListener((windowId) => {
  history.clearWindow(windowId);
  void persistHistory();
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return;
  }

  void (async () => {
    await ready;
    const [tab] = await chrome.tabs.query({ active: true, windowId });
    if (tab?.id !== undefined) {
      await recordTabById(tab.id);
    }
  })();
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "open-tab-switcher") {
    void (async () => {
      await ready;
      await openOverlay();
    })();
    return;
  }

  if (command.startsWith(SWITCH_COMMAND_PREFIX)) {
    const slot = Number(command.replace(SWITCH_COMMAND_PREFIX, ""));
    if (Number.isInteger(slot)) {
      void (async () => {
        await ready;
        await switchToSlot(slot);
      })();
    }
  }
});

chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
  void (async () => {
    if (message.type === "tabqueue:switch-to-tab") {
      await ready;
      await switchToTab(message.tabId);
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "tabqueue:test-open-overlay") {
      await ready;
      await openOverlay();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "tabqueue:test-switch-slot") {
      await ready;
      await switchToSlot(message.slot);
      sendResponse({ ok: true });
      return;
    }

    sendResponse({ ok: false });
  })();

  return true;
});

globalThis.__tabqueueTest = {
  openOverlay: async () => {
    await ready;
    await openOverlay();
  },
  switchToSlot: async (slot: number) => {
    await ready;
    await switchToSlot(slot);
  }
};

async function recordTabById(tabId: number): Promise<void> {
  const tab = await getTab(tabId);
  const snapshot = tab ? toSnapshot(tab) : undefined;

  if (snapshot) {
    await recordAndPersist(snapshot);
  }
}

async function openOverlay(): Promise<void> {
  await refreshLiveHistory();
  const activeTab = await getActiveTab();
  const activeSnapshot = activeTab ? toSnapshot(activeTab) : undefined;

  if (!activeTab?.id || !activeSnapshot || isRestrictedUrl(activeSnapshot.url)) {
    return;
  }

  await recordAndPersist(activeSnapshot);

  const candidates = history.candidates(activeSnapshot.id, activeSnapshot.windowId);
  const message: ContentMessage = {
    type: "tabqueue:show-overlay",
    tabs: candidates,
    timeoutMs: OVERLAY_TIMEOUT_MS
  };

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: activeSnapshot.id },
      files: ["overlay.css"]
    });
    await chrome.scripting.executeScript({
      target: { tabId: activeSnapshot.id },
      files: ["content.js"]
    });
    await chrome.tabs.sendMessage(activeSnapshot.id, message);
  } catch {
    // Restricted pages and transient navigations can reject injection. The v1 UX is graceful no-op.
  }
}

async function switchToSlot(slot: number): Promise<void> {
  await refreshLiveHistory();
  const activeTab = await getActiveTab();
  const activeSnapshot = activeTab ? toSnapshot(activeTab) : undefined;

  if (!activeSnapshot) {
    return;
  }

  const selected = history.candidates(activeSnapshot.id, activeSnapshot.windowId)[slot - 1];
  if (!selected) {
    return;
  }

  await closeOverlay(activeSnapshot.id);
  await switchToTab(selected.id);
}

async function switchToTab(tabId: number): Promise<void> {
  const activeTab = await getActiveTab();
  const activeSnapshot = activeTab ? toSnapshot(activeTab) : undefined;
  const selectedTab = await getTab(tabId);
  const selectedSnapshot = selectedTab ? toSnapshot(selectedTab) : undefined;

  if (!activeSnapshot || !selectedSnapshot) {
    await removeAndPersist(tabId);
    return;
  }

  await closeOverlay(activeSnapshot.id);
  await chrome.tabs.update(tabId, { active: true });
  await chrome.windows.update(selectedSnapshot.windowId, { focused: true });
}

async function closeOverlay(tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "tabqueue:close-overlay" } satisfies BackgroundMessage);
  } catch {
    // The active tab may not currently have the content script injected.
  }
}

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tabs[0];
}

async function getTab(tabId: number): Promise<chrome.tabs.Tab | undefined> {
  try {
    return await chrome.tabs.get(tabId);
  } catch {
    await removeAndPersist(tabId);
    return undefined;
  }
}

async function initializeHistory(): Promise<void> {
  const stored = await loadStoredHistory();
  history.restore(stored);
  await refreshLiveHistory();
}

async function refreshLiveHistory(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  history.refreshFromLiveTabs(tabs.map(toSnapshot).filter((tab): tab is TabSnapshot => tab !== undefined));
  await persistHistory();
}

async function recordAndPersist(tab: TabSnapshot): Promise<void> {
  await ready;
  history.record(tab);
  await persistHistory();
}

async function updateAndPersist(tab: Partial<TabSnapshot> & Pick<TabSnapshot, "id">): Promise<void> {
  await ready;
  history.update(tab);
  await persistHistory();
}

async function removeAndPersist(tabId: number): Promise<void> {
  await ready;
  history.remove(tabId);
  await persistHistory();
}

async function persistHistory(): Promise<void> {
  await saveStoredHistory(history.snapshot());
}

function toSnapshot(tab: chrome.tabs.Tab): TabSnapshot | undefined {
  if (tab.id === undefined || tab.windowId === undefined || !tab.url) {
    return undefined;
  }

  return {
    id: tab.id,
    windowId: tab.windowId,
    title: tab.title?.trim() || "Untitled",
    url: tab.url,
    favIconUrl: tab.favIconUrl
  };
}
