import type { Metadata } from "next";
import NeonBreakerGame from "./neon-breaker-game";

export const metadata: Metadata = {
  title: "Neon Breaker | DK Coder",
  description: "A ten-level neon Breakout challenge with six collectible skills.",
};

export default function NeonBreakerPage() {
  return <NeonBreakerGame />;
}
