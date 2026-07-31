import "./support/neon-fleet-tsx-hooks.mjs";

import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { JSDOM } from "jsdom";

const [
  { NeonFleetBoard },
  { NeonFleetDialog },
  { default: NeonFleetGame },
  { LanguageProvider },
  { BOARD_SIZE, cellKey },
  { autoPlaceEnemy, autoPlaceFleet, createMatch },
  { coordinateLabel },
  { STATS_KEY },
] = await Promise.all([
  import("../app/playground/neon-fleet/neon-fleet-board.tsx"),
  import("../app/playground/neon-fleet/neon-fleet-dialog.tsx"),
  import("../app/playground/neon-fleet/neon-fleet-game.tsx"),
  import("../app/language-provider.tsx"),
  import("../app/playground/neon-fleet/neon-fleet-data.ts"),
  import("../app/playground/neon-fleet/neon-fleet-engine.ts"),
  import("../app/playground/neon-fleet/neon-fleet-ui-state.ts"),
  import("../app/playground/neon-fleet/neon-fleet-storage.ts"),
]);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const globalKeys = [
  "window", "document", "navigator", "HTMLElement", "HTMLButtonElement", "HTMLDialogElement",
  "MutationObserver", "Event", "MouseEvent", "KeyboardEvent", "FocusEvent", "Node", "Storage",
  "localStorage", "sessionStorage", "getComputedStyle",
];

const installDom = ({ dark = false, now = 1000 } = {}) => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
  const saved = new Map(globalKeys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const performanceNowDescriptor = Object.getOwnPropertyDescriptor(globalThis.performance, "now");

  for (const key of globalKeys) {
    const value = key === "getComputedStyle" ? dom.window.getComputedStyle.bind(dom.window) : dom.window[key];
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  Object.defineProperty(globalThis.performance, "now", { configurable: true, value: () => now });

  if (dark) dom.window.document.documentElement.dataset.theme = "dark";
  dom.window.matchMedia = () => ({
    matches: dark,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  });

  let frameId = 0;
  dom.window.requestAnimationFrame = (callback) => {
    frameId += 1;
    callback(now);
    return frameId;
  };
  dom.window.cancelAnimationFrame = () => {};

  let showModalCalls = 0;
  Object.defineProperty(dom.window.HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value() {
      showModalCalls += 1;
      this.open = true;
    },
  });
  Object.defineProperty(dom.window.HTMLDialogElement.prototype, "close", {
    configurable: true,
    value() { this.open = false; },
  });

  return {
    dom,
    get showModalCalls() { return showModalCalls; },
    cleanup() {
      dom.window.close();
      for (const [key, descriptor] of saved) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
      if (performanceNowDescriptor) Object.defineProperty(globalThis.performance, "now", performanceNowDescriptor);
      else delete globalThis.performance.now;
    },
  };
};

const installWindowTimers = (window) => {
  let nextId = 0;
  const tasks = new Map();
  window.setTimeout = (callback, delay = 0, ...args) => {
    nextId += 1;
    tasks.set(nextId, { callback: () => callback(...args), delay, cancelled: false });
    return nextId;
  };
  window.clearTimeout = (id) => {
    const task = tasks.get(Number(id));
    if (task) task.cancelled = true;
  };

  return {
    pending(delay) {
      return [...tasks.values()].filter((task) => !task.cancelled && task.delay === delay).length;
    },
    async runNext(delay) {
      const entry = [...tasks.entries()].find(([, task]) => !task.cancelled && task.delay === delay);
      assert.ok(entry, `missing ${delay}ms timer`);
      const [id, task] = entry;
      tasks.delete(id);
      await act(async () => { task.callback(); });
    },
  };
};

const mount = async (element) => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => { root.render(element); });
  return {
    container,
    root,
    async cleanup() {
      await act(async () => { root.unmount(); });
      container.remove();
    },
  };
};

const click = async (element) => {
  assert.ok(element, "expected clickable element");
  await act(async () => { element.click(); });
};

const buttonByText = (container, text) => [...container.querySelectorAll("button")]
  .find((button) => button.textContent.replace(/\s+/g, " ").trim() === text);

const gameElement = () => React.createElement(
  LanguageProvider,
  null,
  React.createElement(NeonFleetGame),
);

test("native dialog shows modally, handles Escape, focuses action, and restores trigger focus", async () => {
  const environment = installDom();
  const trigger = document.createElement("button");
  trigger.textContent = "Pause";
  document.body.append(trigger);
  trigger.focus();
  const returnFocusRef = { current: trigger };
  let escapeCalls = 0;

  function PauseHarness() {
    const [open, setOpen] = React.useState(true);
    return React.createElement(
      NeonFleetDialog,
      {
        className: "overlay",
        labelledBy: "pause-title",
        onEscape: () => { escapeCalls += 1; setOpen(false); },
        open,
        returnFocusRef,
      },
      React.createElement("h2", { id: "pause-title" }, "Paused"),
      React.createElement("button", null, "Resume"),
    );
  }

  const view = await mount(React.createElement(PauseHarness));
  try {
    const dialog = view.container.querySelector("dialog");
    assert.equal(environment.showModalCalls, 1);
    assert.equal(dialog.open, true);
    assert.equal(document.activeElement?.textContent, "Resume");

    let dispatched;
    await act(async () => {
      dispatched = dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    });
    assert.equal(dispatched, false);
    assert.equal(escapeCalls, 1);
    assert.equal(dialog.open, false);
    assert.equal(document.activeElement, trigger);

    await act(async () => {
      view.root.render(React.createElement(
        NeonFleetDialog,
        { className: "overlay", labelledBy: "terminal-title", open: true, returnFocusRef },
        React.createElement("h2", { id: "terminal-title" }, "Victory"),
        React.createElement("button", null, "Rematch"),
      ));
    });
    const terminalDialog = view.container.querySelector("dialog");
    const terminalCancel = terminalDialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    assert.equal(terminalCancel, false);
    assert.equal(terminalDialog.open, true);
  } finally {
    await view.cleanup();
    trigger.remove();
    environment.cleanup();
  }
});

test("roving grid focus stays near the fired cell and returns after the AI turn", async () => {
  const environment = installDom();
  const emptyBoard = { ships: [], shots: {} };
  const target = { x: 4, y: 4 };
  const targetKey = cellKey(target);
  const renderBoard = (active, tried) => React.createElement(NeonFleetBoard, {
    active,
    board: tried ? { ...emptyBoard, shots: { [targetKey]: "miss" } } : emptyBoard,
    enemy: true,
    isCellActionable: (cell) => !tried || cellKey(cell) !== targetKey,
    label: "Enemy Waters",
    onCellAction: () => {},
  });

  const view = await mount(renderBoard(true, false));
  try {
    let cells = [...view.container.querySelectorAll('[role="gridcell"]')];
    assert.equal(cells.length, BOARD_SIZE * BOARD_SIZE);
    await act(async () => { cells[44].focus(); });
    assert.equal(document.activeElement, cells[44]);

    await act(async () => { view.root.render(renderBoard(false, true)); });
    await act(async () => { view.root.render(renderBoard(true, true)); });

    cells = [...view.container.querySelectorAll('[role="gridcell"]')];
    assert.equal(cells[44].disabled, true);
    assert.equal(cells[45].tabIndex, 0);
    assert.equal(cells[0].tabIndex, -1);
    assert.equal(document.activeElement, cells[45]);
  } finally {
    await view.cleanup();
    environment.cleanup();
  }
});

test("AI schedules one delayed shot, cancels it while paused, and resumes with one shot", async () => {
  const environment = installDom();
  const timers = installWindowTimers(window);
  const view = await mount(gameElement());
  try {
    await click(buttonByText(view.container, "Auto-place"));
    await click(buttonByText(view.container, "Start battle"));
    const enemyGrid = view.container.querySelector('[role="grid"][aria-label="Enemy Waters"]');
    await click(enemyGrid.querySelector("button:not(:disabled)"));
    assert.equal(timers.pending(600), 1);

    await click(buttonByText(view.container, "Pause"));
    assert.equal(timers.pending(600), 0);
    assert.equal(view.container.querySelector("dialog[open]")?.getAttribute("aria-labelledby"), "pause-title");

    await click(buttonByText(view.container, "Resume"));
    assert.equal(timers.pending(600), 1);
    await timers.runNext(600);
    assert.equal(timers.pending(600), 0);

    const playerGrid = view.container.querySelector('[role="grid"][aria-label="Your Fleet"]');
    assert.equal(playerGrid.querySelectorAll("button[data-shot]").length, 1);
    assert.match(view.container.querySelector('[aria-label="Battle status"]').textContent, /Your turn/);
  } finally {
    await view.cleanup();
    environment.cleanup();
  }
});

test("terminal persistence writes once per run and exactly once again after rematch", async () => {
  const environment = installDom({ now: 1000 });
  const timers = installWindowTimers(window);
  const storagePrototype = window.Storage.prototype;
  const originalSetItem = storagePrototype.setItem;
  let statsWrites = 0;
  storagePrototype.setItem = function setItem(key, value) {
    if (key === STATS_KEY) statsWrites += 1;
    return originalSetItem.call(this, key, value);
  };

  const view = await mount(gameElement());
  const playWinningRun = async (seed) => {
    const expected = autoPlaceEnemy(autoPlaceFleet(createMatch("normal", seed)));
    const targets = expected.enemy.ships.flatMap((ship) => ship.cells);
    await click(buttonByText(view.container, "Auto-place"));
    await click(buttonByText(view.container, "Start battle"));

    for (let index = 0; index < targets.length; index += 1) {
      const label = `Enemy ${coordinateLabel(targets[index])},`;
      const target = [...view.container.querySelectorAll('[role="grid"][aria-label="Enemy Waters"] button')]
        .find((button) => button.getAttribute("aria-label")?.startsWith(label));
      await click(target);
      if (index < targets.length - 1) {
        assert.equal(timers.pending(600), 1);
        await timers.runNext(600);
      }
    }
  };

  try {
    await playWinningRun(20260729);
    assert.equal(JSON.parse(localStorage.getItem(STATS_KEY)).byDifficulty.normal.played, 1);
    assert.equal(statsWrites, 1);

    await act(async () => { view.root.render(gameElement()); });
    assert.equal(statsWrites, 1);

    await click(buttonByText(view.container, "Rematch"));
    await playWinningRun(1000);
    assert.equal(JSON.parse(localStorage.getItem(STATS_KEY)).byDifficulty.normal.played, 2);
    assert.equal(statsWrites, 2);
  } finally {
    storagePrototype.setItem = originalSetItem;
    await view.cleanup();
    environment.cleanup();
  }
});

test("game hydrates server markup before transitioning to the document theme", async () => {
  const serverMarkup = renderToString(gameElement());
  assert.match(serverMarkup, /class="page light"/);

  const environment = installDom({ dark: true });
  installWindowTimers(window);
  const container = document.createElement("div");
  container.innerHTML = serverMarkup;
  document.body.append(container);
  const recoverableErrors = [];
  let root;
  try {
    await act(async () => {
      root = hydrateRoot(container, gameElement(), {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });
    const main = container.querySelector("main");
    assert.match(main.className, /\bdark\b/);
    assert.doesNotMatch(main.className, /\blight\b/);
    assert.deepEqual(recoverableErrors, []);
  } finally {
    if (root) await act(async () => { root.unmount(); });
    container.remove();
    environment.cleanup();
  }
});
