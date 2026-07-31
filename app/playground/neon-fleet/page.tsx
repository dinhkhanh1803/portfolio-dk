import type { Metadata } from "next";
import NeonFleetGame from "./neon-fleet-game";

export const metadata: Metadata = {
  title: "Neon Fleet — Battleship",
  description: "Place your fleet, read the radar, and outthink three levels of Battleship AI.",
};

export default function NeonFleetPage() {
  return <NeonFleetGame />;
}
