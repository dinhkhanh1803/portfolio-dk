import type { Metadata } from "next";
import NeonKeysGame from "./neon-keys-song-game";

export const metadata: Metadata = {
  title: "Neon Keys — Piano Rush",
  description: "Play a twelve-key synth piano or chase falling notes in a sixty-second rhythm challenge.",
};

export default function NeonKeysPage() {
  return <NeonKeysGame />;
}
