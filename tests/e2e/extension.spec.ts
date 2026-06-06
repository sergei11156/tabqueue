import { expect, test, chromium, type BrowserContext, type Page } from "@playwright/test";
import path from "node:path";

const extensionPath = path.resolve("dist");

test("renders the overlay and switches recent tabs", async () => {
  const context = await launchExtensionContext();

  try {
    const worker = await getServiceWorker(context);
    if (!worker) {
      test.skip(true, "Chromium did not expose the extension service worker in this environment.");
      return;
    }

    await context.route("http://tabqueue.test/**", async (route) => {
      const url = new URL(route.request().url());
      const title = url.pathname.replace("/", "") || "home";
      await route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><title>${title}</title><main>${title}</main>`
      });
    });

    const first = await openTab(context, "one");
    const second = await openTab(context, "two");
    const third = await openTab(context, "three");

    await first.bringToFront();
    await second.bringToFront();
    await third.bringToFront();
    await worker.evaluate(() => globalThis.__tabqueueTest.openOverlay());

    const overlayRoot = third.locator("#tabqueue-overlay-root");
    await expect(overlayRoot).toBeAttached();

    const overlayText = await overlayRoot.evaluate((root) => root.shadowRoot?.textContent ?? "");
    expect(overlayText).toContain("two");
    expect(overlayText).toContain("one");

    await third.keyboard.press("1");
    await expect.poll(() => activeTabTitle(worker)).toBe("two");

    await worker.evaluate(() => globalThis.__tabqueueTest.switchToSlot(1));
    await expect.poll(() => activeTabTitle(worker)).toBe("three");

    await first.close();
    await second.close();
    await third.close();
  } finally {
    await context.close();
  }
});

async function launchExtensionContext(): Promise<BrowserContext> {
  return chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: process.env.HEADED !== "1",
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });
}

async function getServiceWorker(context: BrowserContext) {
  return (
    context.serviceWorkers()[0] ??
    (await Promise.race([
      context.waitForEvent("serviceworker"),
      new Promise<undefined>((resolve) => {
        setTimeout(() => resolve(undefined), 5000);
      })
    ]))
  );
}

async function openTab(context: BrowserContext, name: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`http://tabqueue.test/${name}`);
  await page.bringToFront();
  await expect(page).toHaveTitle(name);
  return page;
}

async function activeTabTitle(worker: Awaited<ReturnType<typeof getServiceWorker>>): Promise<string | undefined> {
  if (!worker) {
    return undefined;
  }

  return worker.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.title;
  });
}
