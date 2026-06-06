import type { OverlayTabItem, TabSnapshot } from "./types";
import { toDisplayUrl } from "./url";

const DEFAULT_LIMIT = 10;

export class RecentTabHistory {
  private readonly histories = new Map<number, TabSnapshot[]>();

  record(tab: TabSnapshot): void {
    const current = this.histories.get(tab.windowId) ?? [];
    const withoutDuplicate = current.filter((entry) => entry.id !== tab.id);
    this.histories.set(tab.windowId, [tab, ...withoutDuplicate]);
  }

  update(tab: Partial<TabSnapshot> & Pick<TabSnapshot, "id">): void {
    for (const [windowId, history] of this.histories.entries()) {
      const index = history.findIndex((entry) => entry.id === tab.id);
      if (index === -1) {
        continue;
      }

      const next = { ...history[index], ...tab };
      history[index] = next;
      this.setOrDelete(windowId, history);
      return;
    }
  }

  remove(tabId: number): void {
    for (const [windowId, history] of this.histories.entries()) {
      this.setOrDelete(
        windowId,
        history.filter((entry) => entry.id !== tabId)
      );
    }
  }

  replace(removedTabId: number, addedTab: TabSnapshot): void {
    this.remove(removedTabId);
    this.record(addedTab);
  }

  clearWindow(windowId: number): void {
    this.histories.delete(windowId);
  }

  candidates(windowId: number, currentTabId: number, limit = DEFAULT_LIMIT): OverlayTabItem[] {
    const history = this.histories.get(windowId) ?? [];

    return history
      .filter((entry) => entry.id !== currentTabId)
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        slot: index + 1,
        displayUrl: toDisplayUrl(entry.url)
      }));
  }

  snapshot(windowId: number): TabSnapshot[] {
    return [...(this.histories.get(windowId) ?? [])];
  }

  private setOrDelete(windowId: number, history: TabSnapshot[]): void {
    if (history.length === 0) {
      this.histories.delete(windowId);
      return;
    }

    this.histories.set(windowId, history);
  }
}
