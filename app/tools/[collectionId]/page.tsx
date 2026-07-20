"use client";

import { useParams } from "next/navigation";
import { ToolsHub } from "../page";

export default function ToolCollectionPage() {
  const params = useParams<{ collectionId: string }>();
  return <ToolsHub key={params.collectionId} collectionId={params.collectionId} />;
}