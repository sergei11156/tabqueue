import { afterEach, describe, expect, it, vi } from "vitest";
import { loadStoredHistory, saveStoredHistory } from "../src/storage";
import { TAB_HISTORY_STORAGE_KEY, type SerializedTabHistory, type TabSnapshot } from "../src/types";

const storedTab: TabSnapshot = {
  id: 1,
  windowId: 2,
  title: "Stored",
  url: "chrome://extensions"
};

describe("storage helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("serializes history into chrome.storage.session", async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("chrome", {
      storage: {
        session: {
          set
        }
      }
    });

    await saveStoredHistory([storedTab]);

    expect(set).toHaveBeenCalledWith({
      [TAB_HISTORY_STORAGE_KEY]: {
        version: 1,
        tabs: [storedTab]
      }
    });
  });

  it("loads valid stored history", async () => {
    const payload: SerializedTabHistory = {
      version: 1,
      tabs: [storedTab]
    };
    vi.stubGlobal("chrome", {
      storage: {
        session: {
          get: vi.fn().mockResolvedValue({
            [TAB_HISTORY_STORAGE_KEY]: payload
          })
        }
      }
    });

    await expect(loadStoredHistory()).resolves.toEqual([storedTab]);
  });

  it("drops invalid stored entries", async () => {
    vi.stubGlobal("chrome", {
      storage: {
        session: {
          get: vi.fn().mockResolvedValue({
            [TAB_HISTORY_STORAGE_KEY]: {
              version: 1,
              tabs: [storedTab, { id: "bad" }]
            }
          })
        }
      }
    });

    await expect(loadStoredHistory()).resolves.toEqual([storedTab]);
  });
});
