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

    expect(history.snapshot(1).map((entry) => entry.id)).toEqual([1, 2]);
    expect(history.snapshot(1)[0].title).toBe("Again");
  });

  it("keeps window histories separate", () => {
    const history = new RecentTabHistory();

    history.record(tab(1, 1));
    history.record(tab(2, 2));

    expect(history.snapshot(1).map((entry) => entry.id)).toEqual([1]);
    expect(history.snapshot(2).map((entry) => entry.id)).toEqual([2]);
  });

  it("removes closed tabs from every history", () => {
    const history = new RecentTabHistory();

    history.record(tab(1, 1));
    history.record(tab(2, 1));
    history.record(tab(1, 2));
    history.remove(1);

    expect(history.snapshot(1).map((entry) => entry.id)).toEqual([2]);
    expect(history.snapshot(2)).toEqual([]);
  });

  it("updates tracked tab metadata", () => {
    const history = new RecentTabHistory();

    history.record(tab(1));
    history.update({ id: 1, title: "Updated", url: "https://updated.test/docs" });

    expect(history.snapshot(1)[0]).toMatchObject({
      id: 1,
      title: "Updated",
      url: "https://updated.test/docs"
    });
  });

  it("replaces stale tab ids", () => {
    const history = new RecentTabHistory();

    history.record(tab(1));
    history.replace(1, tab(3));

    expect(history.snapshot(1).map((entry) => entry.id)).toEqual([3]);
  });

  it("excludes the current tab and limits candidates", () => {
    const history = new RecentTabHistory();

    for (let id = 1; id <= 12; id += 1) {
      history.record(tab(id));
    }

    const candidates = history.candidates(1, 12);

    expect(candidates).toHaveLength(10);
    expect(candidates[0]).toMatchObject({ id: 11, slot: 1 });
    expect(candidates.at(-1)).toMatchObject({ id: 2, slot: 10 });
  });

  it("keeps restricted urls in history and candidates for switching", () => {
    const history = new RecentTabHistory();

    history.record(tab(1));
    history.record(tab(2, 1, { url: "chrome://extensions" }));
    history.record(tab(3, 1, { url: "about:blank" }));

    expect(history.snapshot(1).map((entry) => entry.id)).toEqual([3, 2, 1]);
    expect(history.candidates(1, 99).map((entry) => entry.id)).toEqual([3, 2, 1]);
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
