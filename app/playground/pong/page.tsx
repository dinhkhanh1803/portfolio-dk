import type { Metadata } from "next";
import PongGame from "./pong-game";

export const metadata: Metadata = {
  title: "Neon Classic Pong | DK Coder",
  description: "Classic neon Pong for one or two players, playable directly in your browser.",
};

export default function PongPage() {
  return <PongGame />;
}
