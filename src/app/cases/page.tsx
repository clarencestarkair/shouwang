import type { Metadata } from "next";
import { SiteNav } from "@/components/common/SiteNav";
import { CasesExplorer } from "@/components/cases/CasesExplorer";
import { CASES } from "@/lib/core/rag";

export const metadata: Metadata = { title: "案例库 · 守望" };

export default function CasesPage() {
  return (
    <div className="dark-stage grain min-h-dvh">
      <SiteNav />
      <CasesExplorer cases={CASES} />
    </div>
  );
}
