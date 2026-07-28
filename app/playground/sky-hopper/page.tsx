import type { Metadata } from "next";
import SkyHopperGame from "./sky-hopper-game";

export const metadata: Metadata = {
  title: "Sky Hopper | DK Coder",
  description: "A fast, original tap-to-fly browser arcade game.",
};

export default function SkyHopperPage() {
  return <SkyHopperGame />;
}
