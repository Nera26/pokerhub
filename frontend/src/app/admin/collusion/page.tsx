"use client";
import dynamic from "next/dynamic";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";

const CollusionPage = dynamic(() => import("@/features/collusion"), {
  loading: () => <div>Loading...</div>,
});

export default function CollusionReviewPage() {
  useRequireAdmin();
  return <CollusionPage />;
}

