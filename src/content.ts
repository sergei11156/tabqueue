import type { BackgroundMessage, ContentMessage, OverlayTabItem } from "./types";

const ROOT_ID = "tabqueue-overlay-root";
const ACTIVE_CLASS = "tabqueue-item-active";

let activeOverlay: HTMLElement | undefined;
let activeShadow: ShadowRoot | undefined;
let timeoutId: number | undefined;
let currentTabs: OverlayTabItem[] = [];
let selectedIndex = 0;

const globalState = globalThis as typeof globalThis & {
  __tabqueueContentLoaded?: boolean;
};

if (!globalState.__tabqueueContentLoaded) {
  globalState.__tabqueueContentLoaded = true;

  chrome.runtime.onMessage.addListener((message: ContentMessage | BackgroundMessage) => {
    if (message.type === "tabqueue:show-overlay") {
      showOverlay(message.tabs, message.timeoutMs);
      return;
    }

    if (message.type === "tabqueue:close-overlay") {
      closeOverlay();
    }
  });
}

function showOverlay(tabs: OverlayTabItem[], timeoutMs: number): void {
  closeOverlay();

  currentTabs = tabs;
  selectedIndex = tabs.length > 0 ? 0 : -1;
  const host = document.createElement("div");
  host.id = ROOT_ID;
  activeShadow = host.attachShadow({ mode: "open" });

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = chrome.runtime.getURL("overlay.css");

  const backdrop = document.createElement("div");
  backdrop.className = "tabqueue-backdrop";
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) {
      closeOverlay();
    }
  });

  const panel = document.createElement("section");
  panel.className = "tabqueue-panel";
  panel.setAttribute("role", "listbox");
  panel.setAttribute("aria-label", "Recent tabs");

  const list = document.createElement("div");
  list.className = "tabqueue-list";

  if (tabs.length === 0) {
    const empty = document.createElement("div");
    empty.className = "tabqueue-empty";
    empty.textContent = "No recent tabs in this window";
    list.append(empty);
  } else {
    for (const tab of tabs) {
      list.append(createTabItem(tab));
    }
  }

  panel.append(list);
  backdrop.append(panel);
  activeShadow.append(stylesheet, backdrop);
  document.documentElement.append(host);
  activeOverlay = host;

  document.addEventListener("keydown", handleKeyDown, true);
  resetTimeout(timeoutMs);
}

function createTabItem(tab: OverlayTabItem): HTMLElement {
  const item = document.createElement("button");
  item.type = "button";
  item.className = `tabqueue-item ${tab.slot === 1 ? ACTIVE_CLASS : ""}`;
  item.setAttribute("role", "option");
  item.setAttribute("aria-selected", String(tab.slot === 1));
  item.dataset.slot = String(tab.slot);
  item.addEventListener("click", () => selectTab(tab));

  const number = document.createElement("span");
  number.className = "tabqueue-number";
  number.textContent = tab.slot === 10 ? "0" : String(tab.slot);

  const faviconWrap = document.createElement("span");
  faviconWrap.className = "tabqueue-favicon";

  if (tab.favIconUrl) {
    const favicon = document.createElement("img");
    favicon.alt = "";
    favicon.referrerPolicy = "no-referrer";
    favicon.src = tab.favIconUrl;
    favicon.addEventListener("error", () => {
      favicon.remove();
      faviconWrap.textContent = fallbackInitial(tab.title);
    });
    faviconWrap.append(favicon);
  } else {
    faviconWrap.textContent = fallbackInitial(tab.title);
  }

  const text = document.createElement("span");
  text.className = "tabqueue-text";

  const title = document.createElement("span");
  title.className = "tabqueue-title";
  title.textContent = tab.title || "Untitled";

  const url = document.createElement("span");
  url.className = "tabqueue-url";
  url.textContent = tab.displayUrl;

  const context = document.createElement("span");
  context.className = `tabqueue-window ${tab.isCurrentWindow ? "tabqueue-window-current" : ""}`;
  context.textContent = tab.windowLabel;

  text.append(title, url);
  item.append(number, faviconWrap, text);
  item.append(context);

  return item;
}

function handleKeyDown(event: KeyboardEvent): void {
  if (!activeOverlay) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeOverlay();
    return;
  }

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    event.stopPropagation();
    moveSelection(event.key === "ArrowDown" ? 1 : -1);
    return;
  }

  if (event.key === "Enter") {
    const tab = currentTabs[selectedIndex];
    if (!tab) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    selectTab(tab);
    return;
  }

  const slot = keyToSlot(event.key);
  if (!slot) {
    return;
  }

  const tab = currentTabs[slot - 1];
  if (!tab) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  selectTab(tab);
}

function moveSelection(delta: number): void {
  if (currentTabs.length === 0) {
    return;
  }

  selectedIndex = (selectedIndex + delta + currentTabs.length) % currentTabs.length;
  updateSelectedItem();
}

function updateSelectedItem(): void {
  if (!activeShadow) {
    return;
  }

  const items = activeShadow.querySelectorAll<HTMLElement>(".tabqueue-item");
  items.forEach((item, index) => {
    const selected = index === selectedIndex;
    item.classList.toggle(ACTIVE_CLASS, selected);
    item.setAttribute("aria-selected", String(selected));
  });
}

function keyToSlot(key: string): number | undefined {
  if (key === "0") {
    return 10;
  }

  const slot = Number(key);
  return Number.isInteger(slot) && slot >= 1 && slot <= 9 ? slot : undefined;
}

function selectTab(tab: OverlayTabItem): void {
  closeOverlay();
  void chrome.runtime.sendMessage({
    type: "tabqueue:switch-to-tab",
    tabId: tab.id
  } satisfies BackgroundMessage);
}

function resetTimeout(timeoutMs: number): void {
  if (timeoutId !== undefined) {
    window.clearTimeout(timeoutId);
  }

  timeoutId = window.setTimeout(() => closeOverlay(), timeoutMs);
}

function closeOverlay(): void {
  if (timeoutId !== undefined) {
    window.clearTimeout(timeoutId);
    timeoutId = undefined;
  }

  document.removeEventListener("keydown", handleKeyDown, true);
  activeOverlay?.remove();
  activeOverlay = undefined;
  activeShadow = undefined;
  currentTabs = [];
  selectedIndex = 0;
}

function fallbackInitial(title: string): string {
  return title.trim().charAt(0).toUpperCase() || "*";
}
