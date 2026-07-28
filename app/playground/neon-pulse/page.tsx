import type { Metadata } from "next";
import NeonPulseGame from "./neon-pulse-game";

export const metadata: Metadata = {
  title: "Neon Pulse | DK Games",
  description:
    "A fast browser reaction game with escalating rhythm, combos, and neon effects.",
};

export default function NeonPulsePage() {
  return <NeonPulseGame />;
}

