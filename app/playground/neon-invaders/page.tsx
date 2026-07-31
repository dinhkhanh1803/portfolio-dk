import type { Metadata } from "next";
import NeonInvadersGame from "./neon-invaders-game";

export const metadata: Metadata = {
  title: "Neon Invaders — Space Shooter",
  description: "Defend the grid through ten alien waves, two bosses, combos, and four arcade power-ups.",
};

export default function NeonInvadersPage() {
  return <NeonInvadersGame />;
}
