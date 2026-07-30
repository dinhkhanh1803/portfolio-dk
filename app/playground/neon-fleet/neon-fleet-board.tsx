"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { BOARD_SIZE, cellKey, type BoardState, type Cell } from "./neon-fleet-data";
import { coordinateLabel, nextGridIndex } from "./neon-fleet-ui-state";
import styles from "./neon-fleet.module.css";

type PlacementPreview = { valid: boolean; keys: Set<string> } | null;

type NeonFleetBoardProps = {
  active: boolean;
  board: BoardState;
  enemy: boolean;
  label: string;
  onCellAction: (cell: Cell) => void;
  onCellFocus?: (cell: Cell) => void;
  onMouseLeave?: () => void;
  onRotate?: () => void;
  preview?: PlacementPreview;
  radarActive?: boolean;
  revealAllShips?: boolean;
  isCellActionable: (cell: Cell) => boolean;
};

const navigationKeys = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"]);

export function NeonFleetBoard({
  active,
  board,
  enemy,
  isCellActionable,
  label,
  onCellAction,
  onCellFocus,
  onMouseLeave,
  onRotate,
  preview = null,
  radarActive = false,
  revealAllShips = false,
}: NeonFleetBoardProps) {
  const cells = useMemo(() => Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
    x: index % BOARD_SIZE,
    y: Math.floor(index / BOARD_SIZE),
  })), []);
  const actionable = cells.map((cell) => active && isCellActionable(cell));
  const [rovingIndex, setRovingIndex] = useState(() => actionable.findIndex(Boolean));
  const cellRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const resolvedRovingIndex = rovingIndex >= 0 && actionable[rovingIndex] ? rovingIndex : actionable.findIndex(Boolean);

  const moveFocus = (index: number, event: KeyboardEvent<HTMLButtonElement>) => {
    if (!navigationKeys.has(event.key)) return;
    event.preventDefault();
    const next = nextGridIndex(index, event.key, actionable);
    if (next === index || !actionable[next]) return;
    setRovingIndex(next);
    cellRefs.current[next]?.focus();
  };

  return (
    <div
      className={`${styles.board} ${radarActive ? styles.radarActive : ""}`}
      role="grid"
      aria-label={label}
      aria-rowcount={BOARD_SIZE}
      aria-colcount={BOARD_SIZE}
      onMouseLeave={onMouseLeave}
      onContextMenu={(event) => {
        if (!onRotate) return;
        event.preventDefault();
        onRotate();
      }}
    >
      {Array.from({ length: BOARD_SIZE }, (_, rowIndex) => (
        <div className={styles.boardRow} role="row" key={rowIndex}>
          {Array.from({ length: BOARD_SIZE }, (_, columnIndex) => {
            const index = rowIndex * BOARD_SIZE + columnIndex;
            const cell = cells[index];
            const key = cellKey(cell);
            const ship = board.ships.find((item) => item.cells.some((part) => cellKey(part) === key));
            const shot = board.shots[key];
            const revealShip = Boolean(ship && (!enemy || shot === "sunk" || revealAllShips));
            const placement = !enemy && preview?.keys.has(key) ? (preview.valid ? "valid" : "invalid") : undefined;
            const canAct = actionable[index];

            return (
              <button
                ref={(node) => { cellRefs.current[index] = node; }}
                type="button"
                role="gridcell"
                key={key}
                data-ship={revealShip || undefined}
                data-shot={shot}
                data-preview={placement}
                disabled={!canAct}
                tabIndex={canAct && index === resolvedRovingIndex ? 0 : -1}
                aria-label={`${enemy ? "Enemy" : "Your"} ${coordinateLabel(cell)}, ${shot ?? (revealShip ? "ship" : "untried")}`}
                onMouseEnter={() => canAct && onCellFocus?.(cell)}
                onFocus={() => {
                  setRovingIndex(index);
                  if (canAct) onCellFocus?.(cell);
                }}
                onKeyDown={(event) => moveFocus(index, event)}
                onClick={() => onCellAction(cell)}
              >
                {shot === "miss" && <span className={styles.missMark} aria-hidden="true" />}
                {(shot === "hit" || shot === "sunk") && <span className={styles.hitMark} aria-hidden="true">&times;</span>}
              </button>
            );
          })}
        </div>
      ))}
      {radarActive && <span className={styles.radarSweep} aria-hidden="true" />}
    </div>
  );
}
