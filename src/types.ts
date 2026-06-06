export interface TabSnapshot {
  id: number;
  windowId: number;
  title: string;
  url: string;
  favIconUrl?: string;
}

export interface OverlayTabItem extends TabSnapshot {
  slot: number;
  displayUrl: string;
  isCurrentWindow: boolean;
  windowLabel: string;
}

export interface SerializedTabHistory {
  version: 1;
  tabs: TabSnapshot[];
}

export const TAB_HISTORY_STORAGE_KEY = "tabqueue:global-history";

export type BackgroundMessage =
  | {
      type: "tabqueue:switch-to-tab";
      tabId: number;
    }
  | {
      type: "tabqueue:close-overlay";
    }
  | {
      type: "tabqueue:test-open-overlay";
    }
  | {
      type: "tabqueue:test-switch-slot";
      slot: number;
    };

export type ContentMessage = {
  type: "tabqueue:show-overlay";
  tabs: OverlayTabItem[];
  timeoutMs: number;
};
