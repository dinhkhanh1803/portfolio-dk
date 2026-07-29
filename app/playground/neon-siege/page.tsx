import type { Metadata } from "next";
import NeonSiegeGame from "./neon-siege-game";

export const metadata: Metadata = {
  title: "Neon Siege | DK Coder",
  description: "A twelve-wave neon tower-defense campaign with four towers and active combat skills.",
};

export default function NeonSiegePage() {
  return <NeonSiegeGame />;
}
