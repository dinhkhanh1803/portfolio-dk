import type { Metadata } from "next";
import NeonBlocksGame from "./neon-blocks-game";

export const metadata: Metadata = {
  title: "Neon Blocks — Tetris Arcade",
  description: "Stack, rotate, hold, and clear lines in a polished neon falling-block arcade game.",
};

export default function NeonBlocksPage() {
  return <NeonBlocksGame />;
}
