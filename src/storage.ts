import { TAB_HISTORY_STORAGE_KEY, type SerializedTabHistory, type TabSnapshot } from "./types";

export async function loadStoredHistory(): Promise<TabSnapshot[]> {
  const result = await chrome.storage.session.get(TAB_HISTORY_STORAGE_KEY);
  const stored = result[TAB_HISTORY_STORAGE_KEY] as SerializedTabHistory | undefined;

  if (!stored || stored.version !== 1 || !Array.isArray(stored.tabs)) {
    return [];
  }

  return stored.tabs.filter(isStoredTabSnapshot);
}

export async function saveStoredHistory(tabs: TabSnapshot[]): Promise<void> {
  const payload: SerializedTabHistory = {
    version: 1,
    tabs
  };

  await chrome.storage.session.set({
    [TAB_HISTORY_STORAGE_KEY]: payload
  });
}

function isStoredTabSnapshot(value: unknown): value is TabSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const tab = value as Partial<TabSnapshot>;
  return (
    typeof tab.id === "number" &&
    typeof tab.windowId === "number" &&
    typeof tab.title === "string" &&
    typeof tab.url === "string" &&
    (tab.favIconUrl === undefined || typeof tab.favIconUrl === "string")
  );
}
