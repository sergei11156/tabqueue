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
}

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
