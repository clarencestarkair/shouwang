import type { Metadata } from "next";
import { SiteNav } from "@/components/common/SiteNav";
import { ConsoleApp } from "@/components/analysis/ConsoleApp";

export const metadata: Metadata = { title: "Agent 指挥台 · 守望" };

export default function ConsolePage() {
  return (
    <div className="dark-stage grain min-h-dvh">
      <SiteNav />
      <ConsoleApp />
    </div>
  );
}
