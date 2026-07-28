import type { Metadata } from "next";
import MergeFoundryGame from "./merge-foundry-game";

export const metadata: Metadata = {
  title: "Merge Foundry | DK Coder Games",
  description:
    "Slide, merge, and deliver materials in a calm browser strategy puzzle.",
};

export default function MergeFoundryPage() {
  return <MergeFoundryGame />;
}
