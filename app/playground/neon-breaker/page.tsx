import type { Metadata } from "next";
import NeonBreakerGame from "./neon-breaker-game";

export const metadata: Metadata = {
  title: "Neon Breaker | DK Coder",
  description: "A five-level neon Breakout challenge playable directly in your browser.",
};

export default function NeonBreakerPage() {
  return <NeonBreakerGame />;
}
