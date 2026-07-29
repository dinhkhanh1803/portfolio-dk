import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("stage resume buttons stay inside the settings group", async () => {
  const source = await readFile(
    new URL("../app/playground/neon-serpent/neon-serpent-game.tsx", import.meta.url),
    "utf8",
  );

  const stageButtons = source.indexOf("key={`stage-${index + 1}`}");
  const settingsStart = source.indexOf('className={styles.settings}');
  const settingsEnd = source.indexOf("</div>", settingsStart);

  assert.ok(stageButtons > 0, "stage resume buttons should be rendered");
  assert.ok(
    stageButtons > settingsStart && stageButtons < settingsEnd,
    "stage resume buttons should render inside the settings group",
  );
});
