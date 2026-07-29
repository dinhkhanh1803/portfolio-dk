import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("stage resume buttons stay in settings instead of directional controls", async () => {
  const source = await readFile(
    new URL("../app/playground/neon-serpent/neon-serpent-game.tsx", import.meta.url),
    "utf8",
  );

  const stageButtons = source.indexOf("key={`stage-${index + 1}`}");
  const directionalControls = source.indexOf('className={styles.dpad}');

  assert.ok(stageButtons > 0, "stage resume buttons should be rendered");
  assert.ok(
    stageButtons < directionalControls,
    "stage resume buttons should render before the directional control group",
  );
});
