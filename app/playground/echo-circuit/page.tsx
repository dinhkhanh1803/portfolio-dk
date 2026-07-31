import type { Metadata } from "next";
import EchoCircuitGame from "./echo-circuit-game";

export const metadata: Metadata = {
  title: "Echo Circuit — Sound Memory",
  description: "Listen, remember, and replay an accelerating sequence of neon tones.",
};

export default function EchoCircuitPage() {
  return <EchoCircuitGame />;
}
