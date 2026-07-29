import type { Metadata } from "next";
import NeonSerpentGame from "./neon-serpent-game";

export const metadata: Metadata = {
  title: "Neon Serpent | DK Coder",
  description: "A neon Snake roguelite campaign with skills, bosses, and an unlockable Endless mode.",
};

export default function NeonSerpentPage() {
  return <NeonSerpentGame />;
}
