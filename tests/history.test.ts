import { describe, expect, it } from "vitest";
import { RecentTabHistory } from "../src/history";
import type { TabSnapshot } from "../src/types";
import { isRestrictedUrl, toDisplayUrl } from "../src/url";

function tab(id: number, windowId = 1, overrides: Partial<TabSnapshot> = {}): TabSnapshot {
  return {
    id,
    windowId,
    title: `Tab ${id}`,
    url: `https://example${id}.test/path`,
    favIconUrl: `https://example${id}.test/favicon.ico`,
    ...overrides
  };
}

describe("RecentTabHistory", () => {
  it("moves activated tabs to the front without duplicates", () => {
    const history = new RecentTabHistory();

    history.record(tab(1));
    history.record(tab(2));
    history.record(tab(1, 1, { title: "Again" }));

    expect(history.snapshot().map((entry) => entry.id)).toEqual([1, 2]);
    expect(history.snapshot()[0].title).toBe("Again");
  });

  it("orders tabs globally across windows", () => {
    const history = new RecentTabHistory();

    history.record(tab(1, 1));
    history.record(tab(2, 2));
    history.record(tab(3, 1));

    expect(history.snapshot().map((entry) => entry.id)).toEqual([3, 2, 1]);
  });

  it("removes closed tabs from global history", () => {
    const history = new RecentTabHistory();

    history.record(tab(1, 1));
    history.record(tab(2, 1));
    history.record(tab(1, 2));
    history.remove(1);

    expect(history.snapshot().map((entry) => entry.id)).toEqual([2]);
  });

  it("updates tracked tab metadata", () => {
    const history = new RecentTabHistory();

    history.record(tab(1));
    history.update({ id: 1, title: "Updated", url: "https://updated.test/docs" });

    expect(history.snapshot()[0]).toMatchObject({
      id: 1,
      title: "Updated",
      url: "https://updated.test/docs"
    });
  });

  it("replaces stale tab ids", () => {
    const history = new RecentTabHistory();

    history.record(tab(1));
    history.replace(1, tab(3));

    expect(history.snapshot().map((entry) => entry.id)).toEqual([3]);
  });

  it("excludes the current tab and limits global candidates", () => {
    const history = new RecentTabHistory();

    for (let id = 1; id <= 12; id += 1) {
      history.record(tab(id));
    }

    const candidates = history.candidates(12, 1);

    expect(candidates).toHaveLength(10);
    expect(candidates[0]).toMatchObject({ id: 11, slot: 1 });
    expect(candidates.at(-1)).toMatchObject({ id: 2, slot: 10 });
  });

  it("keeps restricted urls in history and candidates for switching", () => {
    const history = new RecentTabHistory();

    history.record(tab(1));
    history.record(tab(2, 1, { url: "chrome://extensions" }));
    history.record(tab(3, 1, { url: "about:blank" }));

    expect(history.snapshot().map((entry) => entry.id)).toEqual([3, 2, 1]);
    expect(history.candidates(99, 1).map((entry) => entry.id)).toEqual([3, 2, 1]);
  });

  it("marks candidate window context", () => {
    const history = new RecentTabHistory();

    history.record(tab(1, 1));
    history.record(tab(2, 2));

    expect(history.candidates(99, 1)).toEqual([
      expect.objectContaining({
        id: 2,
        isCurrentWindow: false,
        windowLabel: "Window 2"
      }),
      expect.objectContaining({
        id: 1,
        isCurrentWindow: true,
        windowLabel: "This window"
      })
    ]);
  });

  it("restores serialized history while removing duplicate ids", () => {
    const history = new RecentTabHistory();

    history.restore([tab(1), tab(2), tab(1, 1, { title: "Duplicate" })]);

    expect(history.snapshot().map((entry) => entry.id)).toEqual([1, 2]);
    expect(history.snapshot()[0].title).toBe("Tab 1");
  });

  it("prunes stale restored entries and refreshes metadata from live tabs", () => {
    const history = new RecentTabHistory();

    history.restore([tab(1), tab(2), tab(3)]);
    history.refreshFromLiveTabs([
      tab(3, 4, { title: "Live 3", url: "https://live3.test" }),
      tab(1, 2, { title: "Live 1", url: "https://live1.test" })
    ]);

    expect(history.snapshot()).toEqual([
      expect.objectContaining({ id: 1, windowId: 2, title: "Live 1", url: "https://live1.test" }),
      expect.objectContaining({ id: 3, windowId: 4, title: "Live 3", url: "https://live3.test" })
    ]);
  });
});

describe("url helpers", () => {
  it("detects restricted urls", () => {
    expect(isRestrictedUrl("chrome://extensions")).toBe(true);
    expect(isRestrictedUrl("edge://settings")).toBe(true);
    expect(isRestrictedUrl("about:blank")).toBe(true);
    expect(isRestrictedUrl("https://example.test")).toBe(false);
  });

  it("shortens urls for display", () => {
    expect(toDisplayUrl("https://docs.example.test/path?q=1")).toBe("docs.example.test");
  });
});
