import type { OverlayTabItem, TabSnapshot } from "./types";
import { toDisplayUrl } from "./url";

const DEFAULT_LIMIT = 10;

export class RecentTabHistory {
  private history: TabSnapshot[] = [];

  record(tab: TabSnapshot): void {
    const withoutDuplicate = this.history.filter((entry) => entry.id !== tab.id);
    this.history = [tab, ...withoutDuplicate];
  }

  update(tab: Partial<TabSnapshot> & Pick<TabSnapshot, "id">): void {
    const index = this.history.findIndex((entry) => entry.id === tab.id);
    if (index === -1) {
      return;
    }

    this.history[index] = { ...this.history[index], ...tab };
  }

  remove(tabId: number): void {
    this.history = this.history.filter((entry) => entry.id !== tabId);
  }

  replace(removedTabId: number, addedTab: TabSnapshot): void {
    this.remove(removedTabId);
    this.record(addedTab);
  }

  clearWindow(windowId: number): void {
    this.history = this.history.filter((entry) => entry.windowId !== windowId);
  }

  restore(tabs: TabSnapshot[]): void {
    const seen = new Set<number>();
    this.history = [];

    for (const tab of tabs) {
      if (seen.has(tab.id)) {
        continue;
      }

      seen.add(tab.id);
      this.history.push(tab);
    }
  }

  refreshFromLiveTabs(liveTabs: TabSnapshot[]): void {
    const liveById = new Map(liveTabs.map((tab) => [tab.id, tab]));

    this.history = this.history
      .map((entry) => liveById.get(entry.id))
      .filter((entry): entry is TabSnapshot => entry !== undefined);
  }

  candidates(currentTabId: number, currentWindowId: number, limit = DEFAULT_LIMIT): OverlayTabItem[] {
    return this.history
      .filter((entry) => entry.id !== currentTabId)
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        slot: index + 1,
        displayUrl: toDisplayUrl(entry.url),
        isCurrentWindow: entry.windowId === currentWindowId,
        windowLabel: entry.windowId === currentWindowId ? "This window" : `Window ${entry.windowId}`
      }));
  }

  snapshot(): TabSnapshot[] {
    return [...this.history];
  }
}
