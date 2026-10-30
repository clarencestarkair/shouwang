import type { Metadata } from "next";
import { SiteNav } from "@/components/common/SiteNav";
import { FamilyBoard } from "@/components/family/FamilyBoard";

export const metadata: Metadata = { title: "子女端 · 守望" };

export default function FamilyPage() {
  return (
    <div className="dark-stage grain min-h-dvh">
      <SiteNav />
      <FamilyBoard />
    </div>
  );
}
